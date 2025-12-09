import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBudgetDto {
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(3, { message: 'Descrição deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
  description: string;

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount: number;

  @IsString({ message: 'Tipo deve ser uma string' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  type: string;

  @IsNumber({}, { message: 'Mês deve ser um número' })
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  month: number;

  @IsNumber({}, { message: 'Ano deve ser um número' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  @Min(2000, { message: 'Ano deve ser maior que 2000' })
  year: number;
}
