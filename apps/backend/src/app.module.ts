import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { DbModule } from './db/db.module'
import { AuthModule } from './auth/auth.module'
import { ProductsModule } from './products/products.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { ClientsModule } from './clients/clients.module'
import { SalesModule } from './sales/sales.module'
import { QuotesModule } from './quotes/quotes.module'
import { CashModule } from './cash/cash.module'
import { StockMovementsModule } from './stock-movements/stock-movements.module'
import { ExpensesModule } from './expenses/expenses.module'
import { ReportsModule } from './reports/reports.module'
import { UploadModule } from './upload/upload.module'
import { SuppliersModule } from './suppliers/suppliers.module'
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module'
import { ReservationsModule } from './reservations/reservations.module'
import { AlertsModule } from './alerts/alerts.module'
import { TransfersModule } from './transfers/transfers.module'
import { UsersModule } from './users/users.module'
import { NotificationsModule } from './notifications/notifications.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
    DbModule,
    AuthModule,
    ProductsModule,
    VehiclesModule,
    ClientsModule,
    SalesModule,
    QuotesModule,
    CashModule,
    StockMovementsModule,
    ExpensesModule,
    ReportsModule,
    UploadModule,
    SuppliersModule,
    PurchaseOrdersModule,
    ReservationsModule,
    AlertsModule,
    TransfersModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
