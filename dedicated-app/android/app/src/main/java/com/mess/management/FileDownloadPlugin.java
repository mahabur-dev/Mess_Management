package com.mess.management;

import android.Manifest;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "FileDownload",
    permissions = {
        @Permission(
            alias = "storage",
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class FileDownloadPlugin extends Plugin {
    @PluginMethod
    public void saveBase64(PluginCall call) {
        if (
            Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            getPermissionState("storage") != PermissionState.GRANTED
        ) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }
        saveBase64AfterPermission(call);
    }

    @PluginMethod
    public void shareSavedFile(PluginCall call) {
        String rawUri = call.getString("uri");
        if (rawUri == null || rawUri.isEmpty()) {
            call.reject("Saved file URI is required");
            return;
        }

        String mimeType = call.getString("mimeType", "application/pdf");
        String title = call.getString("title", "MessZen report");
        String dialogTitle = call.getString("dialogTitle", "Share report");

        try {
            Uri uri = shareableUri(Uri.parse(rawUri));
            Intent sendIntent = new Intent(Intent.ACTION_SEND);
            sendIntent.setType(mimeType);
            sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
            sendIntent.setClipData(ClipData.newRawUri("MessZen report", uri));
            sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(sendIntent, dialogTitle);
            getActivity().startActivity(chooser);

            // Resolve as soon as the chooser opens. Closing it without selecting
            // an app must not turn an already-saved download into an error.
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not open the share options", error);
        }
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("Storage permission is required to save the PDF");
            return;
        }
        saveBase64AfterPermission(call);
    }

    private void saveBase64AfterPermission(PluginCall call) {
        String filename = safeFilename(call.getString("filename", "messzen-monthly-report.pdf"));
        String encoded = call.getString("data");
        String mimeType = call.getString("mimeType", "application/pdf");
        if (encoded == null || encoded.isEmpty()) {
            call.reject("File data is required");
            return;
        }

        final byte[] bytes;
        try {
            bytes = Base64.decode(encoded, Base64.DEFAULT);
        } catch (IllegalArgumentException error) {
            call.reject("File data is invalid", error);
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveWithMediaStore(call, filename, mimeType, bytes);
            } else {
                saveLegacy(call, filename, mimeType, bytes);
            }
        } catch (Exception error) {
            call.reject("Could not save file to Downloads", error);
        }
    }

    private void saveWithMediaStore(
        PluginCall call,
        String filename,
        String mimeType,
        byte[] bytes
    ) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(
            MediaStore.MediaColumns.RELATIVE_PATH,
            Environment.DIRECTORY_DOWNLOADS + "/MessZen Reports"
        );
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IllegalStateException("Downloads collection is unavailable");

        try {
            try (OutputStream output = resolver.openOutputStream(uri, "w")) {
                if (output == null) throw new IllegalStateException("Could not open download file");
                output.write(bytes);
                output.flush();
            }
            ContentValues ready = new ContentValues();
            ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(uri, ready, null, null);
            resolve(call, uri.toString(), "Downloads/MessZen Reports/" + filename);
        } catch (Exception error) {
            resolver.delete(uri, null, null);
            throw error;
        }
    }

    @SuppressWarnings("deprecation")
    private void saveLegacy(
        PluginCall call,
        String filename,
        String mimeType,
        byte[] bytes
    ) throws Exception {
        File directory = new File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "MessZen Reports"
        );
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IllegalStateException("Could not create download directory");
        }
        File file = uniqueFile(directory, filename);
        try (FileOutputStream output = new FileOutputStream(file)) {
            output.write(bytes);
            output.flush();
        }
        MediaScannerConnection.scanFile(
            getContext(),
            new String[] { file.getAbsolutePath() },
            new String[] { mimeType },
            null
        );
        resolve(call, Uri.fromFile(file).toString(), file.getAbsolutePath());
    }

    private File uniqueFile(File directory, String filename) {
        File candidate = new File(directory, filename);
        if (!candidate.exists()) return candidate;
        int dot = filename.lastIndexOf('.');
        String stem = dot > 0 ? filename.substring(0, dot) : filename;
        String extension = dot > 0 ? filename.substring(dot) : "";
        int index = 1;
        while (candidate.exists()) {
            candidate = new File(directory, stem + "-" + index + extension);
            index += 1;
        }
        return candidate;
    }

    private Uri shareableUri(Uri uri) {
        if (!"file".equalsIgnoreCase(uri.getScheme())) return uri;
        return FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            new File(uri.getPath())
        );
    }

    private String safeFilename(String value) {
        String cleaned = value.replaceAll("[^a-zA-Z0-9._-]+", "-");
        cleaned = cleaned.replaceAll("^-+|-+$", "");
        return cleaned.isEmpty() ? "messzen-monthly-report.pdf" : cleaned;
    }

    private void resolve(PluginCall call, String uri, String path) {
        JSObject result = new JSObject();
        result.put("uri", uri);
        result.put("path", path);
        call.resolve(result);
    }
}
