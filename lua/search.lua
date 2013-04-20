-- Autocomplete searching
local prefix = ARGV[1]
local term = ARGV[2]
local count = tonumber(ARGV[3]) - 1
print('SEARCH', prefix..term, count)
return redis.call('ZREVRANGE', prefix..term, 0, count)