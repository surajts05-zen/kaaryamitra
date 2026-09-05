import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { ReportsService } from './reports.service.js';

const prisma = new PrismaClient();

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'mock@gmail.com',
    pass: process.env.GMAIL_PASS || 'mock_pass'
  }
});

export class ReportsScheduler {
  static async processScheduledReports() {
    console.log('Processing scheduled reports...');
    
    // In a real app, this would use a cron library (e.g. node-cron) 
    // and parse cronSchedule fields. For now, we simulate processing all scheduled reports.
    const scheduledReports = await prisma.savedReport.findMany({
      where: { isScheduled: true }
    });

    for (const report of scheduledReports) {
      if (!report.emails) continue;
      
      try {
        // Execute the report query
        const data = await ReportsService.executeQuery(report.tenantId, report.dataset, report.config);
        
        // Convert data to CSV string for attachment
        const csv = this.convertToCSV(data);
        
        // Send email
        await transporter.sendMail({
          from: process.env.GMAIL_USER || 'reports@kaaryamitra.com',
          to: report.emails,
          subject: `Scheduled Report: ${report.name}`,
          text: `Please find attached your scheduled report: ${report.name}.`,
          attachments: [
            {
              filename: `${report.name.replace(/\s+/g, '_')}.csv`,
              content: csv
            }
          ]
        });
        console.log(`Sent scheduled report ${report.name} to ${report.emails}`);
      } catch (err) {
        console.error(`Failed to process scheduled report ${report.id}:`, err);
      }
    }
  }

  private static convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return 'No data';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
