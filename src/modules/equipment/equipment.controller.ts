import { Controller } from "@nestjs/common";
import { EquipmentService } from "./equipment.services";

@Controller()
export class EquipmentController{
    constructor(private readonly appService: EquipmentService){



    }
}