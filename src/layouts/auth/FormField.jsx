import { Input } from '@material-tailwind/react'

// Еквівалент пари x-input-label + x-text-input + x-input-error з бекенду,
// зібраний навколо MT Input (плаваючий label вбудований у сам компонент).
export default function FormField({ label, error, ...inputProps }) {
  return (
    <div>
      <Input label={label} error={Boolean(error)} {...inputProps} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}