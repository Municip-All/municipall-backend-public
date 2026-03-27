import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EquipmentController } from "./equipment.controller";
import { EquipmentRepository } from "./equipment.repository";
import { EquipmentService } from "./equipment.services";
import { Equipment } from "./equipment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Equipment])],
    controllers: [EquipmentController],
    providers:[EquipmentService, EquipmentRepository],
    exports: [EquipmentService],
})

export class EquipmentModule{}