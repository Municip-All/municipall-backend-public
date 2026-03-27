import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { ReportModule } from './modules/report/report.module';
import { WeeklyReportModule } from './modules/weekly_report/weekly_report.module';
import { EquipmentModule } from './modules/equipment/equipment.module';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: true,
  }),
  UserModule,
  ReportModule,
  WeeklyReportModule,
  EquipmentModule,
 ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
