import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User{

    @PrimaryColumn()
    id!: number;

    @Column({type: 'varchar'})
    name!: string;

    @Column({type: 'varchar'})
    surname!: string;

    @Column({type: 'varchar'})
    role!: string;

    @Column({type: 'varchar'})
    email!: string;

    @Column({type: 'varchar'})
    password!: string;

    @CreateDateColumn({type: 'timestamptz'})
    created_at!: Date;

    @UpdateDateColumn({type: 'timestamptz'})
    update_at!: Date;

}
