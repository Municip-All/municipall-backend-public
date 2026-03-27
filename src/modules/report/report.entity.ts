import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Timestamp } from "typeorm/browser";

@Entity()
export class Report{

    @PrimaryGeneratedColumn()
    id : number;

    @Column({type: 'integer'})
    user_id: number;

    @Column({type: 'varchar'})
    content : string;

    @Column({type: 'varchar'})
    services: string;

    @Column({type: 'varchar'})
    states : string;

    @Column({type: 'timestamptz'})
    created_at: Timestamp;

    @Column({type: 'numeric'})
    lat : number;

    @Column({type: 'numeric'})
    lon: number;


}