type SwaggerEnvironment = {
  NODE_ENV?: string;
  SWAGGER_ENABLED?: string;
};

export function isSwaggerEnabled(
  environment: SwaggerEnvironment = process.env,
) {
  const nodeEnvironment = environment.NODE_ENV?.trim().toLowerCase();
  const explicitlyEnabled =
    environment.SWAGGER_ENABLED?.trim().toLowerCase() === 'true';

  return nodeEnvironment !== 'production' && explicitlyEnabled;
}
