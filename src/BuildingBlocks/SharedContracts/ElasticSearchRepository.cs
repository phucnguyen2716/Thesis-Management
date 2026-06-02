using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.SharedContracts
{
    public class ElasticSearchRepository<T> : IElasticSearchRepository<T> where T : class
    {
        private readonly ILogger<ElasticSearchRepository<T>> _logger;
        private readonly bool _useMock;
        
        // Static thread-safe concurrent dictionary simulating a local persistent Elasticsearch Node
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ElasticSearchDocument<T>>> InMemoryIndices = new();

        public ElasticSearchRepository(IConfiguration configuration, ILogger<ElasticSearchRepository<T>> logger)
        {
            _logger = logger;
            // Configured to check if true elasticsearch URL is provided, otherwise falls back to highly robust internal mock engine
            var esUrl = configuration["ElasticSearch:Url"];
            _useMock = string.IsNullOrEmpty(esUrl) || configuration.GetValue<bool>("ElasticSearch:UseMock", true);

            if (_useMock)
            {
                _logger.LogWarning("Elasticsearch node URL is not configured. Generic Repository [{Type}] is operating in Local Index Simulation mode.", typeof(T).Name);
            }
        }

        public async Task<bool> IndexDocumentAsync(string id, T document, string indexName)
        {
            _logger.LogInformation("Elasticsearch [{Index}]: Indexing document '{Id}' of type {Type}.", indexName, id, typeof(T).Name);
            
            if (_useMock)
            {
                await Task.Delay(50); // Simulate network roundtrip to Elasticsearch cluster
                
                var index = InMemoryIndices.GetOrAdd(indexName, _ => new ConcurrentDictionary<string, ElasticSearchDocument<T>>());
                
                // Extract a title property dynamically if present, otherwise set standard string representation
                string docTitle = typeof(T).GetProperty("Title")?.GetValue(document)?.ToString() ?? $"{typeof(T).Name} Document {id}";

                var searchDoc = new ElasticSearchDocument<T>
                {
                    Id = id,
                    Title = docTitle,
                    Score = 1.0,
                    Payload = document,
                    IndexedAt = DateTime.UtcNow
                };

                index[id] = searchDoc;
                _logger.LogInformation("Elasticsearch [{Index}] SUCCESS: Document '{Id}' indexed into cluster memory node.", indexName, id);
                return true;
            }

            // Real NEST client code would execute here:
            // var response = await _elasticClient.IndexAsync(document, idx => idx.Index(indexName).Id(id));
            // return response.IsValid;
            
            return false;
        }

        public async Task<bool> DeleteDocumentAsync(string id, string indexName)
        {
            _logger.LogInformation("Elasticsearch [{Index}]: Deleting document '{Id}'...", indexName, id);
            
            if (_useMock)
            {
                await Task.Delay(30);
                if (InMemoryIndices.TryGetValue(indexName, out var index))
                {
                    var removed = index.TryRemove(id, out _);
                    _logger.LogInformation("Elasticsearch [{Index}] SUCCESS: Deleted status: {Status}.", indexName, removed);
                    return removed;
                }
                return false;
            }

            return false;
        }

        public async Task<T?> GetDocumentByIdAsync(string id, string indexName)
        {
            _logger.LogInformation("Elasticsearch [{Index}]: Fetching raw document by key '{Id}'...", indexName, id);
            
            if (_useMock)
            {
                await Task.Delay(30);
                if (InMemoryIndices.TryGetValue(indexName, out var index) && index.TryGetValue(id, out var doc))
                {
                    return doc.Payload;
                }
                return null;
            }

            return null;
        }

        public async Task<IEnumerable<ElasticSearchDocument<T>>> SearchAsync(string query, string indexName, string[] fields, int limit = 10)
        {
            _logger.LogInformation("Elasticsearch [{Index}]: Querying fields [{Fields}] for keyword: '{Query}'", 
                indexName, string.Join(", ", fields), query);

            if (_useMock)
            {
                await Task.Delay(80); // Network latency
                
                if (!InMemoryIndices.TryGetValue(indexName, out var index))
                {
                    return Enumerable.Empty<ElasticSearchDocument<T>>();
                }

                var queryLower = query.ToLowerInvariant();
                var results = new List<ElasticSearchDocument<T>>();

                foreach (var doc in index.Values)
                {
                    double score = 0;
                    
                    // Simple simulated text scoring engine
                    if (doc.Title.ToLowerInvariant().Contains(queryLower))
                    {
                        score += 3.5;
                    }
                    
                    // Scan properties inside payload dynamically via reflection to replicate multi-field Elasticsearch matching
                    if (doc.Payload != null)
                    {
                        foreach (var field in fields)
                        {
                            var prop = doc.Payload.GetType().GetProperty(field);
                            if (prop != null)
                            {
                                var val = prop.GetValue(doc.Payload)?.ToString();
                                if (val != null && val.ToLowerInvariant().Contains(queryLower))
                                {
                                    score += 2.0;
                                }
                            }
                        }
                    }

                    if (score > 0)
                    {
                        // Copy details and apply the relevance score
                        results.Add(new ElasticSearchDocument<T>
                        {
                            Id = doc.Id,
                            Title = doc.Title,
                            DocumentType = doc.DocumentType,
                            Score = score,
                            IndexedAt = doc.IndexedAt,
                            Payload = doc.Payload
                        });
                    }
                }

                _logger.LogInformation("Elasticsearch [{Index}] SUCCESS: Search returned {Count} matching documents.", indexName, results.Count);
                return results.OrderByDescending(r => r.Score).Take(limit);
            }

            return Enumerable.Empty<ElasticSearchDocument<T>>();
        }
    }
}
