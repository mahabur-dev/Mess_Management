import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  MonthlyReportDepositEntry,
  MonthlyReportExpenseEntry,
  MonthlyReportMemberSnapshot,
  MonthlyReportSnapshot,
} from './monthly-report.types';

type ReportLocale = 'en' | 'bn';
type TextAlign = 'left' | 'center' | 'right';
type TableColumn = { label: string; width: number; align?: TextAlign };

const BRAND = '#008D8C';
const BRAND_DARK = '#087372';
const INK = '#163742';
const MUTED = '#64777D';
const LINE = '#D6E4E6';
const SURFACE = '#F3F8F8';
const DUE = '#A45D3D';
const CREDIT = '#087372';
const PAGE_MARGIN = 28;

const COPY = {
  en: {
    report: 'Monthly Financial Report', finalized: 'FINALIZED', period: 'Period', summary: 'Financial overview',
    totalMembers: 'Total members', totalMeals: 'Total meals', totalExpense: 'Total expenses', mealRate: 'Meal rate',
    totalDeposit: 'Total deposit', totalDue: 'Total due', totalRemaining: 'Total remaining',
    memberStatement: 'Member Financial Statement', memberId: 'Member ID', member: 'Member', role: 'Role',
    manager: 'Manager', memberRole: 'Member', meals: 'Meals', mealCost: 'Meal cost', utilityCost: 'Utility cost',
    rent: 'Rent', totalCost: 'Total cost', deposit: 'Deposit', balance: 'Balance', due: 'Due', credit: 'Credit', settled: 'Settled',
    transactionRegister: 'Transaction Register', expenseRegister: 'Bazar & Expense Register', date: 'Date',
    purchasedBy: 'Purchased by', amount: 'Amount', category: 'Category', expenseTotal: 'Expense total',
    depositRegister: 'Deposit Register', method: 'Method', depositTotal: 'Deposit total',
    noTransactions: 'No transactions recorded for this period.', generatedBy: 'Generated securely by MessZen',
    confidential: 'Confidential financial statement', personalStatement: 'Personal Account Statement',
    personalNote: 'This statement contains only your personal monthly account details.', previousBalance: 'Previous balance',
    paid: 'Deposit + payment',
  },
  bn: {
    report: 'মাসিক আর্থিক রিপোর্ট', finalized: 'চূড়ান্ত', period: 'সময়সীমা', summary: 'আর্থিক সারসংক্ষেপ',
    totalMembers: 'মোট সদস্য', totalMeals: 'মোট মিল', totalExpense: 'মোট খরচ', mealRate: 'মিল রেট',
    totalDeposit: 'মোট ডিপোজিট', totalDue: 'মোট বকেয়া', totalRemaining: 'মোট অবশিষ্ট',
    memberStatement: 'সদস্য আর্থিক স্টেটমেন্ট', memberId: 'সদস্য আইডি', member: 'সদস্য', role: 'ভূমিকা',
    manager: 'ম্যানেজার', memberRole: 'সদস্য', meals: 'মিল', mealCost: 'মিল খরচ', utilityCost: 'ইউটিলিটি',
    rent: 'ভাড়া', totalCost: 'মোট খরচ', deposit: 'ডিপোজিট', balance: 'ব্যালেন্স', due: 'বকেয়া', credit: 'জমা', settled: 'পরিশোধিত',
    transactionRegister: 'লেনদেন রেজিস্টার', expenseRegister: 'বাজার ও খরচের রেজিস্টার', date: 'তারিখ',
    purchasedBy: 'ক্রয়কারী', amount: 'পরিমাণ', category: 'ক্যাটাগরি', expenseTotal: 'মোট খরচ',
    depositRegister: 'ডিপোজিট রেজিস্টার', method: 'মাধ্যম', depositTotal: 'মোট ডিপোজিট',
    noTransactions: 'এই সময়ের জন্য কোনো লেনদেন নেই।', generatedBy: 'MessZen দ্বারা নিরাপদভাবে তৈরি',
    confidential: 'গোপনীয় আর্থিক স্টেটমেন্ট', personalStatement: 'ব্যক্তিগত হিসাবের স্টেটমেন্ট',
    personalNote: 'এই স্টেটমেন্টে শুধু আপনার ব্যক্তিগত মাসিক হিসাব রয়েছে।', previousBalance: 'পূর্বের ব্যালেন্স',
    paid: 'ডিপোজিট + পেমেন্ট',
  },
} as const;

@Injectable()
export class MonthlyReportPdfService {
  async render(snapshot: MonthlyReportSnapshot, locale: ReportLocale, personalMember?: MonthlyReportMemberSnapshot): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4', layout: 'portrait', margin: PAGE_MARGIN, bufferPages: true,
      info: { Title: `${snapshot.mess.name} - ${COPY[locale].report}`, Author: 'MessZen', Subject: `${snapshot.mess.name} monthly financial statement` },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const completed = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    doc.registerFont('Report', require.resolve('@expo-google-fonts/noto-sans-bengali/400Regular/NotoSansBengali_400Regular.ttf'));
    doc.registerFont('ReportBold', require.resolve('@expo-google-fonts/noto-sans-bengali/700Bold/NotoSansBengali_700Bold.ttf'));
    doc.font('Report');

    const copy = COPY[locale];
    const formatter = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { maximumFractionDigits: 2 });
    const number = (value: number) => formatter.format(value);
    const currency = snapshot.mess.currency || 'BDT';
    const money = (value: number) => currency === 'BDT' ? `৳${number(value)}` : `${currency} ${number(value)}`;
    const monthDate = new Date(snapshot.month);
    const monthLabel = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(monthDate);

    this.drawHero(doc, snapshot.mess.name, monthLabel, this.periodLabel(monthDate, locale), copy);
    this.drawSectionTitle(doc, copy.summary);
    this.drawMetricStrip(doc, [
      [copy.totalMembers, number(snapshot.summary.totalMembers)], [copy.totalMeals, number(snapshot.summary.totalMeals)],
      [copy.totalExpense, money(snapshot.summary.totalExpense)], [copy.mealRate, money(snapshot.summary.mealRate)],
      [copy.totalDeposit, money(snapshot.summary.totalDeposit)], [copy.totalDue, money(snapshot.summary.totalDue)],
      [copy.totalRemaining, money(snapshot.summary.totalCredit)],
    ]);

    if (personalMember) {
      this.drawPersonalStatement(doc, personalMember, copy, money, number);
    } else {
      this.drawSectionTitle(doc, copy.memberStatement);
      this.drawMemberTable(doc, snapshot.members, copy, money, number, snapshot.mess.name, monthLabel);
      this.drawTransactionRegisters(doc, snapshot, copy, money, locale, monthLabel);
    }
    this.drawFooters(doc, copy.generatedBy, copy.confidential);
    doc.end();
    return completed;
  }

  private drawHero(doc: PDFKit.PDFDocument, messName: string, month: string, period: string, copy: (typeof COPY)[ReportLocale]) {
    const top = PAGE_MARGIN;
    const width = doc.page.width - PAGE_MARGIN * 2;
    doc.font('ReportBold').fontSize(20).fillColor(BRAND).text(copy.report, PAGE_MARGIN, top, { width: width - 100, lineBreak: false });
    doc.font('ReportBold').fontSize(7).fillColor(BRAND_DARK).text(copy.finalized, PAGE_MARGIN + width - 92, top + 7, { width: 92, align: 'right' });
    doc.font('Report').fontSize(8.5).fillColor(INK).text(`MessZen  |  ${messName}  |  ${month}`, PAGE_MARGIN, top + 34, { width, lineBreak: false });
    doc.font('Report').fontSize(8).fillColor(MUTED).text(`${copy.period}: ${period}`, PAGE_MARGIN, top + 58, { width, lineBreak: false });
    doc.moveTo(PAGE_MARGIN, top + 82).lineTo(doc.page.width - PAGE_MARGIN, top + 82).lineWidth(0.7).strokeColor(LINE).stroke();
    doc.y = top + 96;
  }

  private drawRunningHeader(doc: PDFKit.PDFDocument, messName: string, month: string) {
    const y = PAGE_MARGIN;
    doc.rect(PAGE_MARGIN, y, 4, 34).fill(BRAND);
    doc.font('ReportBold').fontSize(11).fillColor(INK).text(messName, PAGE_MARGIN + 14, y + 2, { width: 330, lineBreak: false });
    doc.font('Report').fontSize(8).fillColor(MUTED).text(month, PAGE_MARGIN + 14, y + 20, { width: 300, lineBreak: false });
    doc.moveTo(PAGE_MARGIN, y + 43).lineTo(doc.page.width - PAGE_MARGIN, y + 43).lineWidth(0.7).strokeColor(LINE).stroke();
    doc.y = y + 56;
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    const y = doc.y;
    doc.font('ReportBold').fontSize(11.5).fillColor(INK).text(title, PAGE_MARGIN, y, { width: doc.page.width - PAGE_MARGIN * 2, lineBreak: false });
    doc.moveTo(PAGE_MARGIN, y + 20).lineTo(doc.page.width - PAGE_MARGIN, y + 20).lineWidth(0.7).strokeColor(BRAND).stroke();
    doc.y = y + 28;
  }

  private drawMetricStrip(doc: PDFKit.PDFDocument, metrics: Array<[string, string]>) {
    const startY = doc.y;
    const width = (doc.page.width - PAGE_MARGIN * 2) / metrics.length;
    metrics.forEach(([label, value], index) => {
      const x = PAGE_MARGIN + index * width;
      doc.rect(x, startY, width, 44).fillAndStroke(index % 2 ? '#F8FBFB' : SURFACE, LINE);
      doc.font('Report').fontSize(5.6).fillColor(MUTED).text(label, x + 4, startY + 8, { width: width - 8, align: 'center', lineBreak: false });
      doc.font('ReportBold').fontSize(8).fillColor(index === 5 ? DUE : BRAND_DARK).text(value, x + 4, startY + 24, { width: width - 8, align: 'center', lineBreak: false });
    });
    doc.y = startY + 57;
  }

  private drawMemberTable(
    doc: PDFKit.PDFDocument, members: MonthlyReportMemberSnapshot[], copy: (typeof COPY)[ReportLocale],
    money: (value: number) => string, number: (value: number) => string, messName: string, month: string,
  ) {
    const columns: TableColumn[] = [
      { label: copy.memberId, width: 42 }, { label: copy.member, width: 88 }, { label: copy.role, width: 36 },
      { label: copy.meals, width: 30, align: 'right' }, { label: copy.mealCost, width: 50, align: 'right' },
      { label: copy.utilityCost, width: 48, align: 'right' }, { label: copy.rent, width: 39, align: 'right' },
      { label: copy.totalCost, width: 55, align: 'right' }, { label: copy.deposit, width: 58, align: 'right' },
      { label: copy.balance, width: 93, align: 'right' },
    ];
    const drawHeader = () => this.drawTableHeader(doc, columns, 23, 5.1);
    drawHeader();
    members.forEach((member, index) => {
      if (doc.y + 29 > this.contentBottom(doc)) {
        doc.addPage(); this.drawRunningHeader(doc, messName, month); this.drawSectionTitle(doc, copy.memberStatement); drawHeader();
      }
      const balance = member.due > 0 ? `${money(member.due)} ${copy.due}` : member.credit > 0 ? `${money(member.credit)} ${copy.credit}` : copy.settled;
      this.drawTableRow(doc, columns, [
        `M-${String(index + 1).padStart(3, '0')}`, member.name, member.role === 'MANAGER' ? copy.manager : copy.memberRole,
        number(member.totalMeals), money(member.mealCost), money(member.utilityCost), money(member.rentCost),
        money(member.totalAmount), money(member.deposit + member.paidAmount), balance,
      ], 29, index % 2 === 0 ? '#FFFFFF' : '#FAFCFC', member.due > 0 ? DUE : CREDIT, 5.6);
    });
  }

  private drawTransactionRegisters(
    doc: PDFKit.PDFDocument, snapshot: MonthlyReportSnapshot, copy: (typeof COPY)[ReportLocale],
    money: (value: number) => string, locale: ReportLocale, month: string,
  ) {
    doc.addPage(); this.drawRunningHeader(doc, snapshot.mess.name, month); this.drawSectionTitle(doc, copy.transactionRegister);
    this.drawRegisterTitle(doc, copy.expenseRegister);
    this.drawExpenseRegister(doc, snapshot.expenseRegister ?? [], copy, money, locale, snapshot.mess.name, month);
    this.ensureSpace(doc, 72 + (snapshot.depositRegister?.length ?? 0) * 29, snapshot.mess.name, month);
    this.drawRegisterTitle(doc, copy.depositRegister);
    this.drawDepositRegister(doc, snapshot.depositRegister ?? [], copy, money, locale, snapshot.mess.name, month);
  }

  private drawRegisterTitle(doc: PDFKit.PDFDocument, title: string) {
    doc.font('ReportBold').fontSize(10.5).fillColor(BRAND_DARK).text(title, PAGE_MARGIN, doc.y, { width: doc.page.width - PAGE_MARGIN * 2, lineBreak: false });
    doc.y += 10;
  }

  private drawExpenseRegister(
    doc: PDFKit.PDFDocument, entries: MonthlyReportExpenseEntry[], copy: (typeof COPY)[ReportLocale],
    money: (value: number) => string, locale: ReportLocale, messName: string, month: string,
  ) {
    const columns: TableColumn[] = [
      { label: copy.date, width: 78 }, { label: copy.purchasedBy, width: 178 },
      { label: copy.amount, width: 100, align: 'right' }, { label: copy.category, width: 183 },
    ];
    this.drawRegisterRows(doc, entries, columns, copy.noTransactions, messName, month, (entry) => [
      this.shortDate(entry.date, locale), entry.purchasedBy, money(entry.amount), this.humanize(entry.description || entry.category),
    ]);
    this.drawRegisterTotal(doc, copy.expenseTotal, money(entries.reduce((sum, entry) => sum + entry.amount, 0)));
  }

  private drawDepositRegister(
    doc: PDFKit.PDFDocument, entries: MonthlyReportDepositEntry[], copy: (typeof COPY)[ReportLocale],
    money: (value: number) => string, locale: ReportLocale, messName: string, month: string,
  ) {
    const columns: TableColumn[] = [
      { label: copy.date, width: 78 }, { label: copy.member, width: 200 },
      { label: copy.method, width: 120 }, { label: copy.amount, width: 141, align: 'right' },
    ];
    this.drawRegisterRows(doc, entries, columns, copy.noTransactions, messName, month, (entry) => [
      this.shortDate(entry.date, locale), entry.member, this.humanize(entry.method), money(entry.amount),
    ]);
    this.drawRegisterTotal(doc, copy.depositTotal, money(entries.reduce((sum, entry) => sum + entry.amount, 0)));
  }

  private drawRegisterRows<T>(
    doc: PDFKit.PDFDocument, entries: T[], columns: TableColumn[], emptyMessage: string, messName: string,
    month: string, values: (entry: T) => string[],
  ) {
    const drawHeader = () => this.drawTableHeader(doc, columns, 25, 7);
    drawHeader();
    if (!entries.length) {
      doc.rect(PAGE_MARGIN, doc.y, columns.reduce((sum, column) => sum + column.width, 0), 34).fillAndStroke('#FFFFFF', LINE);
      doc.font('Report').fontSize(8).fillColor(MUTED).text(emptyMessage, PAGE_MARGIN + 10, doc.y + 11, { width: 519, align: 'center' });
      doc.y += 34; return;
    }
    entries.forEach((entry, index) => {
      if (doc.y + 57 > this.contentBottom(doc)) { doc.addPage(); this.drawRunningHeader(doc, messName, month); drawHeader(); }
      this.drawTableRow(doc, columns, values(entry), 29, index % 2 === 0 ? '#FFFFFF' : '#FAFCFC', undefined, 7.2);
    });
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, columns: TableColumn[], height: number, fontSize: number) {
    const y = doc.y;
    let x = PAGE_MARGIN;
    columns.forEach((column) => {
      doc.rect(x, y, column.width, height).fillAndStroke(BRAND, BRAND);
      doc.font('ReportBold').fontSize(fontSize).fillColor('#FFFFFF').text(column.label, x + 4, y + 8, { width: column.width - 8, align: column.align ?? 'left', lineBreak: false });
      x += column.width;
    });
    doc.y = y + height;
  }

  private drawTableRow(
    doc: PDFKit.PDFDocument, columns: TableColumn[], values: string[], height: number, fill: string,
    lastColumnColor?: string, fontSize = 7.2,
  ) {
    const y = doc.y;
    let x = PAGE_MARGIN;
    values.forEach((value, index) => {
      const column = columns[index];
      doc.rect(x, y, column.width, height).fillAndStroke(fill, LINE);
      doc.font(index === values.length - 1 && lastColumnColor ? 'ReportBold' : 'Report').fontSize(fontSize)
        .fillColor(index === values.length - 1 && lastColumnColor ? lastColumnColor : INK)
        .text(value, x + 4, y + 9, { width: column.width - 8, align: column.align ?? 'left', lineBreak: false, ellipsis: true });
      x += column.width;
    });
    doc.y = y + height;
  }

  private drawRegisterTotal(doc: PDFKit.PDFDocument, label: string, value: string) {
    const y = doc.y + 6;
    doc.font('ReportBold').fontSize(8.5).fillColor(INK).text(`${label}: ${value}`, PAGE_MARGIN, y, { width: doc.page.width - PAGE_MARGIN * 2, align: 'right', lineBreak: false });
    doc.y = y + 24;
  }

  private drawPersonalStatement(
    doc: PDFKit.PDFDocument, member: MonthlyReportMemberSnapshot, copy: (typeof COPY)[ReportLocale],
    money: (value: number) => string, number: (value: number) => string,
  ) {
    this.drawSectionTitle(doc, copy.personalStatement);
    doc.font('Report').fontSize(8).fillColor(MUTED).text(copy.personalNote, PAGE_MARGIN, doc.y, { width: doc.page.width - PAGE_MARGIN * 2 });
    doc.y += 18;
    doc.font('ReportBold').fontSize(14).fillColor(INK).text(member.name, PAGE_MARGIN, doc.y, { width: 420 });
    doc.font('Report').fontSize(8).fillColor(MUTED).text(member.email, PAGE_MARGIN, doc.y + 20, { width: 420 });
    doc.y += 49;
    const balance = member.due > 0 ? `${money(member.due)} ${copy.due}` : member.credit > 0 ? `${money(member.credit)} ${copy.credit}` : copy.settled;
    this.drawMetricStrip(doc, [
      [copy.totalMeals, number(member.totalMeals)], [copy.mealCost, money(member.mealCost)], [copy.utilityCost, money(member.utilityCost)],
      [copy.rent, money(member.rentCost)], [copy.totalCost, money(member.totalAmount)],
      [copy.paid, money(member.deposit + member.paidAmount)], [copy.balance, balance],
    ]);
    doc.y += 8;
    [[copy.previousBalance, money(member.previousBalance)], [copy.deposit, money(member.deposit)], [copy.paid, money(member.paidAmount)]].forEach(([label, value], index) => {
      const y = doc.y;
      doc.rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 30).fillAndStroke(index % 2 ? '#FFFFFF' : SURFACE, LINE);
      doc.font('Report').fontSize(8).fillColor(MUTED).text(label, PAGE_MARGIN + 12, y + 10, { width: 220 });
      doc.font('ReportBold').fontSize(8.5).fillColor(INK).text(value, PAGE_MARGIN + 260, y + 9, { width: 251, align: 'right' });
      doc.y = y + 30;
    });
  }

  private ensureSpace(doc: PDFKit.PDFDocument, height: number, messName: string, month: string) {
    if (doc.y + height <= this.contentBottom(doc)) return;
    doc.addPage(); this.drawRunningHeader(doc, messName, month);
  }

  private contentBottom(doc: PDFKit.PDFDocument) { return doc.page.height - 58; }

  private drawFooters(doc: PDFKit.PDFDocument, generatedBy: string, confidential: string) {
    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      const y = doc.page.height - 37;
      doc.moveTo(PAGE_MARGIN, y - 8).lineTo(doc.page.width - PAGE_MARGIN, y - 8).lineWidth(0.5).strokeColor(LINE).stroke();
      doc.font('Report').fontSize(6.5).fillColor(MUTED).text(generatedBy, PAGE_MARGIN, y, { width: 170, lineBreak: false });
      doc.text(confidential, PAGE_MARGIN + 170, y, { width: 199, align: 'center', lineBreak: false });
      doc.text(`${index + 1} / ${range.count}`, doc.page.width - PAGE_MARGIN - 90, y, { width: 90, align: 'right', lineBreak: false });
    }
  }

  private periodLabel(month: Date, locale: ReportLocale) {
    const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
    const last = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0));
    const formatter = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
    return `${formatter.format(first)} – ${formatter.format(last)}`;
  }

  private shortDate(value: string, locale: ReportLocale) {
    return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: '2-digit', month: 'short', timeZone: 'UTC',
    }).format(new Date(value));
  }

  private humanize(value: string) {
    return value.toLowerCase().split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}
