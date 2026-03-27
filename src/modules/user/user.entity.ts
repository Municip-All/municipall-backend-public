import { Column, Entity, PrimaryColumn, Timestamp } from "typeorm";

@Entity()
export class User{

    @PrimaryColumn()
    id : number;

    @Column({type: 'varchar'})
    name: string;

    @Column({type: 'varchar'})
    surname: string;

    @Column({type: 'varchar'})
    role: string;

    @Column({type: 'varchar'})
    email: string;

    @Column({type: 'varchar'})
    password: string;

    @Column({type: 'timestamptz'})
    created_at: Timestamp;
}