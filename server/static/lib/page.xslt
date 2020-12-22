<?xml
	version="1.0"
	encoding="UTF-8"
	?>
<!-- 
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 -->
<xsl:stylesheet
	version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xhtml="http://www.w3.org/1999/xhtml"
	>

<xsl:template match="/">
	<html
		xmlns="http://www.w3.org/1999/xhtml"
		>
	<head>
		<title>μAdmin for Looker</title>
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous" />
		<link rel="stylesheet" href="/global.css" />
		<xsl:copy-of select="page/xhtml:head/*" />
	</head>
	<body>
		<div id="page">
			<div id="behind-top-nav"></div>
			<div id="top-nav" class="row">
				<span id="nav-home">
					<a href="/">Home</a>
				</span>
				<span id="nav-center"></span>
				<span id="nav-user">
					<a href="/hosts">Auth</a>
				</span>
			</div>
			<div id="msg-bar" class="d-n">
				<div class="row">
					<span id="msg-icon"></span>
					<span id="msg-text"></span>
					<span id="msg-close" onclick="this.parentNode.parentNode.style.display='none'">✕</span>
				</div>
			</div>
			<div id="main" class="col">
				<xsl:copy-of select="page/xhtml:main/*" />
			</div>
			<div id="templates" class="d-n">
				<xsl:copy-of select="page/xhtml:page-templates/*" />
			</div>
		</div>
	</body>
	<script type="module" src="index.mjs" async="async"></script>
	</html>
</xsl:template>

</xsl:stylesheet>