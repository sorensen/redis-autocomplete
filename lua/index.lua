-- Autocomplete indexing
local prefix = ARGV[1]
local ttl = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
local term = ARGV[4]
local i = 1
-- Iterate through all prefixes of a given term
while i <= #term do
  local set = prefix..term:sub(1, i)
  print('INDEX', set)
  -- Find the length of the set, if we are not at the max number, add
  -- the element with a score of 1. Otherwise, remove the element with 
  -- the lowest score, and add the new element with that score + 1
  local len = tonumber(redis.call('ZCARD', set))
  if len < max then
    -- Normal element adding
    redis.call('ZINCRBY', set, 1, term)
  else
    -- Lowest element replacement
    local member, score = unpack(redis.call('ZREVRANGE', set, -1, -1))
    score = score or 0
    redis.call('ZREM', set, member)
    redis.call('ZINCRBY', set, tonumber(score) + 1, term)
  end
  if ttl then redis.call('EXPIRE', set, ttl) end
  i = i + 1
end
return 1