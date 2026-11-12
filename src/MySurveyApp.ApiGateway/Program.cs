using Yarp.ReverseProxy.Transforms;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddDnsDestinationResolver()
    .AddTransforms(context =>
    {
        context.AddResponseTransform(responseContext =>
        {
            var upstream = responseContext.ProxyResponse?.RequestMessage?.RequestUri?.Authority;
            if (!string.IsNullOrEmpty(upstream))
            {
                responseContext.HttpContext.Response.Headers["X-Handled-By"] = upstream;
            }
            return ValueTask.CompletedTask;
        });
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/sql/swagger.json", "MySurveyApp — SqlService API");
        options.SwaggerEndpoint("/swagger/nosql/swagger.json", "MySurveyApp — NoSqlService API");
        options.RoutePrefix = "swagger";
    });
}

app.MapReverseProxy();

app.Run();