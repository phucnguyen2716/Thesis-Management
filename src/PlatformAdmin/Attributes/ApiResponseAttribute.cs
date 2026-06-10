using System;
using Microsoft.AspNetCore.Mvc;

namespace PlatformAdmin.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
    public class ApiResponseAttribute : ProducesResponseTypeAttribute
    {
        public ApiResponseAttribute(int statusCode) : base(statusCode)
        {
        }

        public ApiResponseAttribute(Type type, int statusCode) : base(type, statusCode)
        {
        }
    }
}
