import { Controller } from "@nestjs/common";
import { UserServices } from "./user.services";

@Controller()
export class UserController{
    constructor(private readonly appService: UserServices){
    
    
    
        }
}