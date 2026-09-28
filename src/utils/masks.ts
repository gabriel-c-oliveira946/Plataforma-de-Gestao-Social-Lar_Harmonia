// Helper: Máscara de CPF automática (000.000.000-00 - estrito em 14 caracteres)
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Helper: Máscara de Telefone automática ((00) 00000-0000 ou (00) 0000-0000)
export const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// Helper: RG limpo alfanumérico (máximo 15 caracteres)
export const formatRG = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase();
};

// Prevenir digitação de 'e', 'E', '+', '-', '.' em campos numéricos inteiros
export const handleIntegerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};
