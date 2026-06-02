using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.SharedContracts.ShellScope
{
    /// <summary>
    /// Orchard CMS inspired ShellScope Factory.
    /// Spawns isolated scoped lifetimes for tasks, ensuring database connections
    /// and allocated memory are released instantly upon task completion.
    /// </summary>
    public interface IShellScopeFactory
    {
        /// <summary>
        /// Executes an asynchronous action inside a dedicated, isolated DI scope.
        /// Automatically disposes of all resolved scoped services when completed.
        /// </summary>
        Task UsingAsync(Func<IServiceProvider, Task> action);

        /// <summary>
        /// Executes an asynchronous function returning a result inside an isolated DI scope.
        /// Automatically disposes of all resolved scoped services when completed.
        /// </summary>
        Task<T> UsingAsync<T>(Func<IServiceProvider, Task<T>> action);
    }

    public class ShellScopeFactory : IShellScopeFactory
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<ShellScopeFactory> _logger;

        public ShellScopeFactory(IServiceScopeFactory serviceScopeFactory, ILogger<ShellScopeFactory> logger)
        {
            _serviceScopeFactory = serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task UsingAsync(Func<IServiceProvider, Task> action)
        {
            _logger.LogInformation("ShellScope: Initializing isolated task scope lifecycle...");
            
            // Create the underlying DI scope
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                try
                {
                    // Run the custom action inside the isolated scope boundary
                    await action(scope.ServiceProvider);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ShellScope Error: Exception caught during scoped execution. Scope boundary will still dispose safely.");
                    throw;
                }
                finally
                {
                    _logger.LogInformation("ShellScope: Scoped execution finished. Releasing all scoped resources and memory connections.");
                }
            } // <-- scope.Dispose() is guaranteed to execute here, cleaning up DB connections and DbContexts instantly!
        }

        public async Task<T> UsingAsync<T>(Func<IServiceProvider, Task<T>> action)
        {
            _logger.LogInformation("ShellScope: Initializing isolated task scope lifecycle with return parameter...");

            using (var scope = _serviceScopeFactory.CreateScope())
            {
                try
                {
                    return await action(scope.ServiceProvider);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ShellScope Error: Exception caught during scoped execution returning data. Scope boundary will still dispose safely.");
                    throw;
                }
                finally
                {
                    _logger.LogInformation("ShellScope: Scoped execution returning data finished. Releasing all scoped resources and memory connections.");
                }
            }
        }
    }
}
