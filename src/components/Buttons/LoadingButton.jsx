import { forwardRef } from "react"
import { Spinner } from "@material-tailwind/react"
import { twMerge } from "tailwind-merge"
import Button from "./Button.jsx"

const LoadingButton = forwardRef(function LoadingButton({ isLoading = false, children, className, disabled, ...props }, ref) {
  return (
  <Button ref={ref} disabled={isLoading || disabled} {...props} className={twMerge("relative", className)}>
    <span className={isLoading ? "invisible" : "visible"}>{children}</span>
    {isLoading && (
      <span className="absolute inset-0 flex items-center justify-center">
        <Spinner className="h-4 w-4" />
      </span>
    )}
  </Button>
  )
})

export default LoadingButton
