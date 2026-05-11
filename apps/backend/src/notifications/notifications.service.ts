import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as nodemailer from 'nodemailer'
import { db } from '../db'
import { installments, sales, clients } from '../db/schema'
import { eq, and, lt, inArray } from 'drizzle-orm'

function escHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  private getTransporter() {
    const host = process.env.SMTP_HOST
    if (!host) return null
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Corre todos los días a las 9am
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendOverdueInstallmentEmails() {
    const adminEmail = process.env.ADMIN_EMAIL
    const transporter = this.getTransporter()

    if (!transporter || !adminEmail) {
      this.logger.log('SMTP no configurado — omitiendo notificación de cuotas vencidas')
      return
    }

    const now = new Date()

    const overdueList = await db
      .select({
        installmentId: installments.id,
        number: installments.number,
        amount: installments.amount,
        dueDate: installments.dueDate,
        saleId: installments.saleId,
        clientName: clients.name,
        clientPhone: clients.phone,
      })
      .from(installments)
      .innerJoin(sales, eq(installments.saleId, sales.id))
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .where(and(eq(installments.status, 'pendiente'), lt(installments.dueDate, now)))
      .orderBy(installments.dueDate)

    if (overdueList.length === 0) {
      this.logger.log('Sin cuotas vencidas hoy')
      return
    }

    const rows = overdueList.map(i => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escHtml(i.clientName) || 'Sin cliente'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${escHtml(i.clientPhone) || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">Cuota ${i.number} — Venta #${i.saleId}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">$${Number(i.amount).toLocaleString('es-AR')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#dc2626">${new Date(i.dueDate).toLocaleDateString('es-AR')}</td>
      </tr>`).join('')

    const totalAmount = overdueList.reduce((s, i) => s + Number(i.amount), 0)

    const html = `
      <h2 style="color:#dc2626">SpeedMotors — Cuotas vencidas</h2>
      <p>${overdueList.length} cuota${overdueList.length !== 1 ? 's' : ''} vencida${overdueList.length !== 1 ? 's' : ''} · Total: <strong>$${totalAmount.toLocaleString('es-AR')}</strong></p>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px;text-align:left">Cliente</th>
            <th style="padding:8px;text-align:left">Teléfono</th>
            <th style="padding:8px;text-align:left">Cuota</th>
            <th style="padding:8px;text-align:left">Monto</th>
            <th style="padding:8px;text-align:left">Vencimiento</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: adminEmail,
        subject: `SpeedMotors — ${overdueList.length} cuota${overdueList.length !== 1 ? 's' : ''} vencida${overdueList.length !== 1 ? 's' : ''}`,
        html,
      })
      this.logger.log(`Email enviado a ${adminEmail}: ${overdueList.length} cuotas vencidas`)
    } catch (err) {
      this.logger.error('Error enviando email de cuotas vencidas', err)
    }
  }

  async sendTestEmail(to: string) {
    const transporter = this.getTransporter()
    if (!transporter) throw new Error('SMTP no configurado')
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: 'SpeedMotors — Test de email',
      text: 'Si recibís esto, el SMTP está funcionando correctamente.',
    })
    return { ok: true }
  }
}
