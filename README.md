# 文字水印

**原始 SVG**:

```html
<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="55" stroke="#a2a9b6" stroke-width="5" stroke-opacity="0.3" fill="none" />
  <text x="50%" y="55%" font-size="80" fill="#a2a9b6" fill-opacity="0.3" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(45 60 60)">携</text>
</svg>
```

**转 base64**:

```html
<!-- 删除空格与换行 -->
<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="55" stroke="#a2a9b6" stroke-width="5" stroke-opacity="0.2" fill="none" /><text x="50%" y="55%" font-size="80" fill="#a2a9b6" fill-opacity="0.2" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(45 60 60)">哪</text></svg>

<!-- 转base64 -->
PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI1NSIgc3Ryb2tlPSIjYTJhOWI2IiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1vcGFjaXR5PSIwLjIiIGZpbGw9Im5vbmUiIC8

<!-- CSS 使用 -->
background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI1NSIgc3Ryb2tlPSIjYTJhOWI2IiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1vcGFjaXR5PSIwLjIiIGZpbGw9Im5vbmUiIC8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiNhMmE5YjYiIGZpbGwtb3BhY2l0eT0iMC4yIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSA2MCA2MCkiPuaQujwvdGV4dD48L3N2Zz4=');
```
