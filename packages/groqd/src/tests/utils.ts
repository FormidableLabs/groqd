export function currencyFormat(price: number): string {
  return `$${price.toFixed(2)}`;
}
