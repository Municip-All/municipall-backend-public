import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Timestamp } from "typeorm/browser";

@Entity()
export class Report{

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    role: string;

    @Column()
    name : string;

    @Column()
    email : string;

    @Column()
    password : string;

    @CreateDateColumn()
    created_at: Timestamp;

    
}