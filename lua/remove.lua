-- Autocomplete remove term
local prefix = ARGV[1]
local term = ARGV[2]
local i = 1
local resp = 0
-- Iterate through all prefixes of a given term
while i <= #term do
  local set = prefix..term:sub(1, i)
  resp = resp + redis.call('ZREM', set, term)
  -- Cleanup empty sets
  if tonumber(redis.call('ZCARD', set)) == 0 then
    redis.call('DEL', set)
  end
  i = i + 1
end
return resp