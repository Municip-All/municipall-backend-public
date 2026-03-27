import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Equipment{
   @PrimaryColumn()
   id: number;

   @Column({type: 'char'})
   name: string;

   @Column({type: 'varchar'})
   description: string;

   @Column({type: 'numeric'})
   lat : number;

   @Column({type: 'numeric'})
   lon: number;



}