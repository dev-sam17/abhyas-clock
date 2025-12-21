"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

type Attempt = {
  id: number
  test_name: string
  percentage: string
  completed_at: Date
}

export function PerformanceChart({ attempts }: { attempts: Attempt[] }) {
  const chartData = [...attempts]
    .reverse()
    .slice(-10)
    .map((attempt, index) => ({
      name: `Test ${index + 1}`,
      score: Number(attempt.percentage),
      testName: attempt.test_name,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
        <CardDescription>Your score progression over the last 10 tests</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} name="Score (%)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
