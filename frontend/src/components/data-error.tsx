'use client'

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TableCell, TableRow } from "@/components/ui/table"

const DEFAULT_MESSAGE = "We couldn't load this right now. Please check your connection and try again."

interface DataErrorProps {
  message?: string
  /** Called when the user clicks "Try again" — pass the SWR mutate to refetch. */
  onRetry?: () => void
}

function ErrorBody({ message = DEFAULT_MESSAGE, onRetry }: DataErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Card-style error block for a whole page or section that failed to load. */
export function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <Card className="border-destructive/30" role="alert">
      <CardContent className="py-10">
        <ErrorBody message={message} onRetry={onRetry} />
      </CardContent>
    </Card>
  )
}

/** Error row for inside a <Table>, spanning all columns. */
export function TableError({ colSpan, message, onRetry }: DataErrorProps & { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8">
        <ErrorBody message={message} onRetry={onRetry} />
      </TableCell>
    </TableRow>
  )
}
