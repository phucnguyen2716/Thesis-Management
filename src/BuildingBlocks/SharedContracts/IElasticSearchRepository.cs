using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BuildingBlocks.SharedContracts
{
    /// <summary>
    /// A generic repository interface for Elasticsearch operations.
    /// Provides reusable fast-search, indexing, and management features across microservices.
    /// </summary>
    public interface IElasticSearchRepository<T> where T : class
    {
        /// <summary>
        /// Indexes (saves or updates) a document inside Elasticsearch.
        /// </summary>
        Task<bool> IndexDocumentAsync(string id, T document, string indexName);

        /// <summary>
        /// Removes a document from the Elasticsearch index.
        /// </summary>
        Task<bool> DeleteDocumentAsync(string id, string indexName);

        /// <summary>
        /// Retrieves a single document by its unique key.
        /// </summary>
        Task<T?> GetDocumentByIdAsync(string id, string indexName);

        /// <summary>
        /// Executes a fast cross-field text query.
        /// Returns a generic search result packaging matching payloads and relevance scores.
        /// </summary>
        Task<IEnumerable<ElasticSearchDocument<T>>> SearchAsync(string query, string indexName, string[] fields, int limit = 10);
    }

    /// <summary>
    /// Unified generic model representing search documents returned from Elasticsearch.
    /// Includes relevancy scores, indexing metadata, and type-safe payload information.
    /// </summary>
    public class ElasticSearchDocument<T>
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string DocumentType { get; set; } = typeof(T).Name;
        public double Score { get; set; } // Elasticsearch relevance score
        public DateTime IndexedAt { get; set; } = DateTime.UtcNow;
        public T? Payload { get; set; } // The exact C# object details
    }
}
