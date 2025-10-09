import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
  Badge,
  Code,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/_layout/logs" as any)({
  component: LogsPage,
})

interface LogEntry {
  timestamp: string
  level: string
  logger: string
  message: string
}

interface LogsResponse {
  total: number
  limit: number
  level_filter: string | null
  logs: LogEntry[]
}

interface StatsResponse {
  total_entries: number
  buffer_capacity: number
  level_counts: Record<string, number>
  oldest_entry: string | null
  newest_entry: string | null
}

function LogsPage() {
  const queryClient = useQueryClient()
  const [limit, setLimit] = useState(100)
  const [levelFilter, setLevelFilter] = useState<string>("")
  
  const bgColor = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  const apiBase = import.meta.env.VITE_API_URL ?? ""

  // Fetch logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", limit, levelFilter],
    queryFn: async (): Promise<LogsResponse> => {
      const token = localStorage.getItem("access_token")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const params = new URLSearchParams({ limit: limit.toString() })
      if (levelFilter) {
        params.append("level", levelFilter)
      }

      const res = await fetch(`${apiBase}/api/v1/logs/recent?${params}`, {
        headers,
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch logs")
      return res.json()
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["log-stats"],
    queryFn: async (): Promise<StatsResponse> => {
      const token = localStorage.getItem("access_token")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch(`${apiBase}/api/v1/logs/stats`, {
        headers,
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
    refetchInterval: 10000,
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case "DEBUG":
        return "gray"
      case "INFO":
        return "blue"
      case "WARNING":
        return "yellow"
      case "ERROR":
        return "red"
      case "CRITICAL":
        return "purple"
      default:
        return "gray"
    }
  }

  const handleClearLogs = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      await fetch(`${apiBase}/api/v1/logs/clear`, {
        method: "DELETE",
        headers,
        credentials: "include",
      })
      queryClient.invalidateQueries({ queryKey: ["logs"] })
      queryClient.invalidateQueries({ queryKey: ["log-stats"] })
    } catch (err) {
      console.error("Failed to clear logs:", err)
    }
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box bg="red.50" p={4} borderRadius="md">
          <Text color="red.600">
            Error loading logs. Make sure you're logged in as a superuser.
          </Text>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Application Logs</Heading>
          <HStack>
            <Button onClick={() => refetch()} colorScheme="blue" size="sm">
              Refresh
            </Button>
            <Button onClick={handleClearLogs} colorScheme="red" size="sm">
              Clear Buffer
            </Button>
          </HStack>
        </HStack>

        {/* Stats */}
        {stats && (
          <Box bg={bgColor} p={4} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <HStack spacing={6}>
              <Text>
                <strong>Total:</strong> {stats.total_entries} / {stats.buffer_capacity}
              </Text>
              {Object.entries(stats.level_counts || {}).map(([level, count]) => (
                <Badge key={level} colorScheme={getLevelColor(level)}>
                  {level}: {count as number}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {/* Filters */}
        <HStack>
          <Select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            maxW="200px"
          >
            <option value={50}>Last 50 logs</option>
            <option value={100}>Last 100 logs</option>
            <option value={200}>Last 200 logs</option>
            <option value={500}>Last 500 logs</option>
            <option value={1000}>Last 1000 logs</option>
          </Select>

          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            maxW="200px"
            placeholder="All levels"
          >
            <option value="">All Levels</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </Select>
        </HStack>

        {/* Logs Table */}
        <Box
          bg={bgColor}
          borderRadius="md"
          borderWidth={1}
          borderColor={borderColor}
          overflowX="auto"
        >
          {isLoading ? (
            <Box p={8} textAlign="center">
              <Text>Loading logs...</Text>
            </Box>
          ) : (
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th width="180px">Timestamp</Th>
                  <Th width="80px">Level</Th>
                  <Th width="200px">Logger</Th>
                  <Th>Message</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.logs && data.logs.length > 0 ? (
                  data.logs.map((log: LogEntry, idx: number) => (
                    <Tr key={idx}>
                      <Td fontSize="xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </Td>
                      <Td>
                        <Badge colorScheme={getLevelColor(log.level)} fontSize="xs">
                          {log.level}
                        </Badge>
                      </Td>
                      <Td fontSize="xs">{log.logger}</Td>
                      <Td>
                        <Code fontSize="xs" whiteSpace="pre-wrap">
                          {log.message}
                        </Code>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={8}>
                      <Text color="gray.500">No logs found</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>
    </Container>
  )
}
