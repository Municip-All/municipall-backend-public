import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  email!: string;

  @Column()
  @Index()
  cityId!: string;

  @Column({ default: 'pending' })
  status!: string; // pending, accepted, expired

  @Column({ nullable: true })
  token?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  expiresAt?: Date;
}
