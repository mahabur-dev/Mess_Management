import { Module } from '@nestjs/common';
import { FundLedgerController } from './fund-ledger.controller';
import { FundLedgerService } from './fund-ledger.service';

@Module({
  controllers: [FundLedgerController],
  providers: [FundLedgerService],
  exports: [FundLedgerService],
})
export class FundLedgerModule {}
