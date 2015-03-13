<!DOCTYPE html>
<html>
<head>
<meta charset="<%=charset%>" />
<title>Directory Listing For <%=pathname%></title>
<style>
li{line-height:160%;list-style:none;}
</style>
</head>
<body>
<strong>DIRECTORY LIST FOR <%=pathname%></strong>
<hr />
<ul>
<% items.forEach(function (item) { %>
<li><a href="<%=item.href%>"><%=item.name%></a></li>
<% }); %>
</ul>
</body>
</html>
