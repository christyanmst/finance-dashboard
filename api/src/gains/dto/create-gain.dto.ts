import {
  IsString,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateGainDto {
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount: number;

  @IsString({ message: 'Tipo deve ser uma string' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  type: string;

  @IsString({ message: 'Frequência deve ser uma string' })
  @IsNotEmpty({ message: 'Frequência é obrigatória' })
  frequency: string;

  @IsDateString({}, { message: 'Data deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  date: string;
}
