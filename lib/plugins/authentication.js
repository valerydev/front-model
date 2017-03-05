module.exports = function(models) {
  models.on('beforeRequest', function (config) {
    config.headers = {
      "x-access-token":
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1c3VhcmlvQHBydWViYS5jb20iLCJleHA"  +
          "iOjE0NzQ2NDE5ODk5MDMsImlhdCI6MTQ3NDY0MTM4OTkwMiwidXNlciI6eyJpZCI6MSwicGFzc3dvcmQi" +
          "OiIyMDJjYjk2MmFjNTkwNzViOTY0YjA3MTUyZDIzNGI3MCIsImNvZGUiOiJ1c3VhcmlvQHBydWViYS5jb" +
          "20iLCJjb250cmFjdCI6eyJkaXNhYmxlZE1lbnVzIjoiIn0sImNvbnRyYWN0SWQiOjEsImJyYW5jaCI6ey" +
          "JpZCI6MCwibmFtZSI6IiIsImNvZGUiOiIifSwiYnJhbmNoSWQiOjAsInByb2ZpbGUiOnsibmFtZSI6IlB" +
          "lcmZpbCAwMiIsImRpc2FibGVkTWVudXMiOltdfSwicHJvZmlsZUlkIjo0LCJjbGFzc2lmaWVyMSI6eyJu" +
          "YW1lIjoiVmVuZXp1ZWxhIn0sImNsYXNzaWZpZXIyIjp7Im5hbWUiOiIifSwiY2xhc3NpZmllcjMiOnsib" +
          "mFtZSI6IiJ9LCJjbGFzc2lmaWVySWQxIjoxLCJjbGFzc2lmaWVySWQyIjowLCJjbGFzc2lmaWVySWQzIj" +
          "owLCJlbWFpbCI6InVzdWFyaW9AcHJ1ZWJhLmNvbSIsImZ1bGxOYW1lIjoiVXN1YXJpbyBQcnVlYmEiLCJ" +
          "kaXNhYmxlZE1lbnVzIjpbXSwiY29ubmVjdGlvblNjaGVkdWxlSWQiOjcsImFkZHJlc3MiOiJBdi4yMCIs" +
          "ImNvdW50cnlJZCI6MjA5LCJzdGF0ZUlkIjoxOTg2LCJjaXR5SWQiOjEyOTQ2MCwic3ViTG9jYXRpb25JZ" +
          "DEiOjQsInN1YkxvY2F0aW9uSWQyIjowLCJwcm9wZXJ0aWVzIjpbeyJpZCI6NCwiY29kZSI6MSwicGFyZW" +
          "50Q29kZSI6MSwidmFsdWUiOiIyMCJ9LHsiaWQiOjUsImNvZGUiOjIsInBhcmVudENvZGUiOjEsInZhbHV" +
          "lIjoiNCJ9LHsiaWQiOjYsImNvZGUiOjMsInBhcmVudENvZGUiOjEsInZhbHVlIjoiVCJ9LHsiaWQiOjcs" +
          "ImNvZGUiOjQsInBhcmVudENvZGUiOjEsInZhbHVlIjoiMiJ9LHsiaWQiOjE0LCJjb2RlIjo1LCJwYXJlb" +
          "nRDb2RlIjoxLCJ2YWx1ZSI6IjAifSx7ImlkIjoxNSwiY29kZSI6NiwicGFyZW50Q29kZSI6MSwidmFsdW" +
          "UiOiIzIn0seyJpZCI6MTYsImNvZGUiOjcsInBhcmVudENvZGUiOjEsInZhbHVlIjoiTUcifV0sImN1cnJ" +
          "zeW0iOiJCJCJ9LCJzZXNzaW9uSWQiOjc4Niwic2Vzc2lvbkNvbnN0YW50cyI6eyJOSVZFTF8xIjp7Im5v" +
          "bWJyZSI6IlBhaXMiLCJjb3JyZWxhdGl2byI6IjEifSwiTklWRUxfMiI6eyJub21icmUiOiJEZXNhcnJvb" +
          "GxhZG9yIiwiY29ycmVsYXRpdm8iOiIyIn0sIk5JVkVMXzMiOnsibm9tYnJlIjoiRnJhbnF1aWNpYWRvIi" +
          "wiY29ycmVsYXRpdm8iOiIzIn0sIkNMQVNJRklDQUNJT05fMSI6eyJub21icmUiOiJWZW5lenVlbGEiLCJ" +
          "jb3JyZWxhdGl2byI6IjEifSwiQ0xBU0lGSUNBQ0lPTl8yIjp7Im5vbWJyZSI6IiIsImNvcnJlbGF0aXZv" +
          "IjoiMCJ9LCJDTEFTSUZJQ0FDSU9OXzMiOnsibm9tYnJlIjoiIiwiY29ycmVsYXRpdm8iOiIwIn0sIlNVQ" +
          "1VSU0FMIjp7Im5vbWJyZSI6IiIsImNvcnJlbGF0aXZvIjoiMCJ9fSwiYWNjZXNzTGV2ZWxzIjp7ImRhdF" +
          "9jbGllbnRlcyI6InByZXNlbmNlLUNPTi4xIn0sInR6IjoiLTA0OjAwIiwibG9jYWxlIjoiZW5fVVMiLCJ" +
          "pcCI6Ijo6ZmZmZjoxMjcuMC4wLjEifQ.HkXYE0gzrAepvuxb37F2AjunT7Lg2fcC7G3nmTACscw"
    };
  });
};