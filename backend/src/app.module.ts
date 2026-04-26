import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { PaymentModule } from './app/module/payment/payment.module';
import { WebhookModule } from './app/module/webhook/webhook.module';
import { ControllerModule } from './app/module/controller/controller.module';
import { ExtraModule } from './app/module/extra/extra.module';
import { FaqModule } from './app/module/faq/faq.module';
import { ServiceModule } from './app/module/service/service.module';
import { AuthModule } from './app/module/auth/auth.module';
import { TwilioModule } from './app/module/twilio/twilio.module';

// const databaseImports = config.isMongoEnabled
//   ? [
//       MongooseModule.forRoot(config.mongoUri as string,),
//       UserModule,
//       AuthModule,
//       ContactModule,
//     ]
//   : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri as string),
    PaymentModule,
    WebhookModule,
    AuthModule,
    ControllerModule,
    ExtraModule,
    FaqModule,
    ServiceModule,
    TwilioModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
