import { Column, Entity, PrimaryColumn } from "typeorm";
import { Timestamp } from "typeorm/browser";

@Entity()

export class WeeklyReport{

    @PrimaryColumn()
    id : number;

    @Column({type: 'integer'})
    week : number;

    @Column({type: 'varchar'})
    content: string;

    @Column({type: 'integer'})
    feeling: number;

    @Column({type: 'timestamptz'})
    created_at: Timestamp

    

}