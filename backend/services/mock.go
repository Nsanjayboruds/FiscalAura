package services

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"
)

// mockStore is a simple in-memory key-value store keyed by table -> id -> row.
type mockStore struct {
	mu     sync.RWMutex
	tables map[string]map[string]map[string]interface{}
}

var globalMock = &mockStore{
	tables: make(map[string]map[string]map[string]interface{}),
}

func isMockMode() bool {
	return os.Getenv("MOCK_SUPABASE") == "true"
}

// ensureTable lazily initialises a table map.
func (m *mockStore) ensureTable(table string) {
	if m.tables[table] == nil {
		m.tables[table] = make(map[string]map[string]interface{})
	}
}

// insert adds a row, generating an id and timestamps.
func (m *mockStore) insert(table string, data map[string]interface{}) map[string]interface{} {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.ensureTable(table)

	row := make(map[string]interface{})
	for k, v := range data {
		row[k] = v
	}
	if _, ok := row["id"]; !ok {
		row["id"] = fmt.Sprintf("mock-%s-%d", table, time.Now().UnixNano())
	}
	now := time.Now().Format(time.RFC3339)
	row["created_at"] = now
	row["updated_at"] = now

	id := fmt.Sprint(row["id"])
	m.tables[table][id] = row
	return row
}

// query returns all rows in a table (basic filter by user_id only).
func (m *mockStore) query(table, userID string) []map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	m.ensureTable(table)

	var result []map[string]interface{}
	for _, row := range m.tables[table] {
		if userID == "" || fmt.Sprint(row["user_id"]) == userID {
			result = append(result, row)
		}
	}
	return result
}

// querySingle returns the first row matching user_id (and optionally id).
func (m *mockStore) querySingle(table, userID, id string) map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	m.ensureTable(table)

	for _, row := range m.tables[table] {
		uidMatch := userID == "" || fmt.Sprint(row["user_id"]) == userID
		idMatch := id == "" || fmt.Sprint(row["id"]) == id
		if uidMatch && idMatch {
			return row
		}
	}
	return nil
}

// update patches all rows matching user_id with the given fields.
func (m *mockStore) update(table, userID string, data map[string]interface{}) []map[string]interface{} {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.ensureTable(table)

	now := time.Now().Format(time.RFC3339)
	var updated []map[string]interface{}
	for id, row := range m.tables[table] {
		if fmt.Sprint(row["user_id"]) == userID {
			for k, v := range data {
				row[k] = v
			}
			row["updated_at"] = now
			m.tables[table][id] = row
			updated = append(updated, row)
		}
	}
	return updated
}

// delete removes rows matching user_id and optionally id.
func (m *mockStore) delete(table, userID, id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.ensureTable(table)

	for rowID, row := range m.tables[table] {
		uidMatch := userID == "" || fmt.Sprint(row["user_id"]) == userID
		idMatch := id == "" || rowID == id
		if uidMatch && idMatch {
			delete(m.tables[table], rowID)
		}
	}
}

// count returns the number of rows matching user_id.
func (m *mockStore) count(table, userID string) int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	m.ensureTable(table)

	n := 0
	for _, row := range m.tables[table] {
		if userID == "" || fmt.Sprint(row["user_id"]) == userID {
			n++
		}
	}
	return n
}

// ---- helpers to marshal mock data ----

func toJSON(v interface{}) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

func toJSONArray(rows []map[string]interface{}) json.RawMessage {
	if rows == nil {
		return json.RawMessage("[]")
	}
	b, _ := json.Marshal(rows)
	return b
}

// ---- parseUserIDFromQuery extracts user_id from a query param string ----
// e.g. "user_id=eq.abc123&financial_year=eq.2025-26"
func parseUserIDFromQuery(q string) string {
	for _, part := range strings.Split(q, "&") {
		if strings.HasPrefix(part, "user_id=eq.") {
			return strings.TrimPrefix(part, "user_id=eq.")
		}
	}
	return ""
}

func parseIDFromQuery(q string) string {
	for _, part := range strings.Split(q, "&") {
		if strings.HasPrefix(part, "id=eq.") {
			return strings.TrimPrefix(part, "id=eq.")
		}
	}
	return ""
}

// ---- Mock implementations on SupabaseClient ----

func (s *SupabaseClient) mockQuery(table, queryParams string) (json.RawMessage, error) {
	userID := parseUserIDFromQuery(queryParams)
	rows := globalMock.query(table, userID)
	return toJSONArray(rows), nil
}

func (s *SupabaseClient) mockQuerySingle(table, queryParams string) (json.RawMessage, error) {
	userID := parseUserIDFromQuery(queryParams)
	id := parseIDFromQuery(queryParams)
	row := globalMock.querySingle(table, userID, id)
	if row == nil {
		return nil, nil
	}
	return toJSON(row), nil
}

func (s *SupabaseClient) mockInsert(table string, data interface{}) (json.RawMessage, error) {
	m, ok := data.(map[string]interface{})
	if !ok {
		// Try to marshal and unmarshal
		b, _ := json.Marshal(data)
		json.Unmarshal(b, &m)
	}
	row := globalMock.insert(table, m)
	// Return as array (PostgREST style)
	return toJSONArray([]map[string]interface{}{row}), nil
}

func (s *SupabaseClient) mockUpdate(table, filter string, data interface{}) (json.RawMessage, error) {
	userID := parseUserIDFromQuery(filter)
	m, ok := data.(map[string]interface{})
	if !ok {
		b, _ := json.Marshal(data)
		json.Unmarshal(b, &m)
	}
	rows := globalMock.update(table, userID, m)
	return toJSONArray(rows), nil
}

func (s *SupabaseClient) mockDelete(table, filter string) error {
	userID := parseUserIDFromQuery(filter)
	id := parseIDFromQuery(filter)
	globalMock.delete(table, userID, id)
	return nil
}

func (s *SupabaseClient) mockCount(table, queryParams string) (int, error) {
	userID := parseUserIDFromQuery(queryParams)
	return globalMock.count(table, userID), nil
}
