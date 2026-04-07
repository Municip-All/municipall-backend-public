import { Controller } from "@nestjs/common";
import { EquipmentServices } from "./equipment.services";

@Controller()
export class EquipmentController{
    constructor(private readonly appService: EquipmentServices){



    }
}