/**
 * SMD DROP & GESTOR PRO CNC - Vector Parser
 * Parser cliente-side de alta performance para arquivos SVG e DXF.
 * Detecta dimensões reais (largura x altura em mm), perímetro total de corte e tempo de laser.
 */

export function parseSVG(svgText) {
  if (typeof window === 'undefined') {
    return { width: 500, height: 300, perimeter: 1600, estimatedLaserMinutes: 3, format: 'svg' };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) {
    throw new Error('Arquivo SVG inválido ou corrompido.');
  }

  // 1. Obter dimensões e ViewBox
  const widthAttr = svg.getAttribute('width') || '';
  const heightAttr = svg.getAttribute('height') || '';
  const viewBoxAttr = svg.getAttribute('viewBox') || '';

  let viewBoxWidth = 0;
  let viewBoxHeight = 0;

  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      viewBoxWidth = parts[2];
      viewBoxHeight = parts[3];
    }
  }

  // Conversão de unidades do SVG para milímetros (mm)
  const parseToMm = (valStr, defaultVal) => {
    if (!valStr) return defaultVal;
    const num = parseFloat(valStr) || defaultVal;
    if (valStr.endsWith('cm')) return num * 10;
    if (valStr.endsWith('m')) return num * 1000;
    if (valStr.endsWith('in')) return num * 25.4;
    if (valStr.endsWith('pt')) return num * 0.352778;
    if (valStr.endsWith('px')) return num * 0.264583; // 96 DPI
    return num;
  };

  let width = parseToMm(widthAttr, viewBoxWidth || 500);
  let height = parseToMm(heightAttr, viewBoxHeight || 300);

  const scaleX = viewBoxWidth > 0 ? width / viewBoxWidth : 1;
  const scaleY = viewBoxHeight > 0 ? height / viewBoxHeight : 1;
  const scale = (scaleX + scaleY) / 2;

  // 2. Medir o perímetro linear de corte real via DOM
  let totalLength = 0;
  const tempSvgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvgContainer.style.position = 'absolute';
  tempSvgContainer.style.width = '0';
  tempSvgContainer.style.height = '0';
  tempSvgContainer.style.visibility = 'hidden';
  document.body.appendChild(tempSvgContainer);

  try {
    const shapes = doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon');

    shapes.forEach((shape) => {
      let pathElement = null;
      const tagName = shape.tagName.toLowerCase();

      if (tagName === 'path') {
        pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', shape.getAttribute('d') || '');
      } else if (tagName === 'rect') {
        const w = parseFloat(shape.getAttribute('width') || '0');
        const h = parseFloat(shape.getAttribute('height') || '0');
        totalLength += 2 * (w + h) * scale;
      } else if (tagName === 'circle') {
        const r = parseFloat(shape.getAttribute('r') || '0');
        totalLength += 2 * Math.PI * r * scale;
      } else if (tagName === 'ellipse') {
        const rx = parseFloat(shape.getAttribute('rx') || '0');
        const ry = parseFloat(shape.getAttribute('ry') || '0');
        totalLength += Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))) * scale;
      } else if (tagName === 'line') {
        const x1 = parseFloat(shape.getAttribute('x1') || '0');
        const y1 = parseFloat(shape.getAttribute('y1') || '0');
        const x2 = parseFloat(shape.getAttribute('x2') || '0');
        const y2 = parseFloat(shape.getAttribute('y2') || '0');
        totalLength += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * scale;
      } else if (tagName === 'polyline' || tagName === 'polygon') {
        const pointsStr = shape.getAttribute('points') || '';
        const coords = pointsStr.trim().split(/[\s,]+/).map(Number);
        let len = 0;
        for (let i = 0; i < coords.length - 2; i += 2) {
          len += Math.sqrt((coords[i + 2] - coords[i]) ** 2 + (coords[i + 3] - coords[i + 1]) ** 2);
        }
        if (tagName === 'polygon' && coords.length >= 4) {
          len += Math.sqrt((coords[coords.length - 2] - coords[0]) ** 2 + (coords[coords.length - 1] - coords[1]) ** 2);
        }
        totalLength += len * scale;
      }

      if (pathElement) {
        tempSvgContainer.appendChild(pathElement);
        try {
          totalLength += pathElement.getTotalLength() * scale;
        } catch (e) {
          // Fallback silencioso
        }
        tempSvgContainer.removeChild(pathElement);
      }
    });
  } finally {
    if (tempSvgContainer.parentNode) {
      document.body.removeChild(tempSvgContainer);
    }
  }

  // Fallback se não encontrou shapes medíveis (aproxima pelo contorno da arte)
  if (totalLength === 0) {
    totalLength = 2 * (width + height);
  }

  // Estimativa de tempo de corte:
  // Velocidade média de corte a laser para Acrílico/MDF 3mm: 20 a 30 mm/s (1200 a 1800 mm/min)
  const laserFeedMmMin = 1800;
  const estimatedMinutes = Math.max(1, Math.round(((totalLength / laserFeedMmMin) * 1.15))); // +15% aceleração/desaceleração

  return {
    width: Math.round(width),
    height: Math.round(height),
    perimeterMm: Math.round(totalLength),
    perimeterMeters: Number((totalLength / 1000).toFixed(2)),
    estimatedLaserMinutes: estimatedMinutes,
    format: 'svg'
  };
}

export function parseDXF(dxfText) {
  const lines = dxfText.split(/\r?\n/);
  let perimeter = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const updateBBox = (x, y) => {
    if (isNaN(x) || isNaN(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  let i = 0;
  const nextTag = () => {
    if (i >= lines.length - 1) return null;
    const code = parseInt(lines[i].trim(), 10);
    const value = lines[i + 1].trim();
    i += 2;
    return { code, value };
  };

  let currentEntity = null;
  let entityProps = {};

  const processEntity = () => {
    if (!currentEntity) return;

    if (currentEntity === 'LINE') {
      const x1 = parseFloat(entityProps[10] || 0);
      const y1 = parseFloat(entityProps[20] || 0);
      const x2 = parseFloat(entityProps[11] || 0);
      const y2 = parseFloat(entityProps[21] || 0);

      updateBBox(x1, y1);
      updateBBox(x2, y2);
      perimeter += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    } else if (currentEntity === 'CIRCLE') {
      const cx = parseFloat(entityProps[10] || 0);
      const cy = parseFloat(entityProps[20] || 0);
      const r = parseFloat(entityProps[40] || 0);

      updateBBox(cx - r, cy - r);
      updateBBox(cx + r, cy + r);
      perimeter += 2 * Math.PI * r;
    } else if (currentEntity === 'ARC') {
      const cx = parseFloat(entityProps[10] || 0);
      const cy = parseFloat(entityProps[20] || 0);
      const r = parseFloat(entityProps[40] || 0);
      const startAngle = parseFloat(entityProps[50] || 0);
      const endAngle = parseFloat(entityProps[51] || 0);

      updateBBox(cx - r, cy - r);
      updateBBox(cx + r, cy + r);

      let sweep = endAngle - startAngle;
      if (sweep < 0) sweep += 360;
      perimeter += r * ((sweep * Math.PI) / 180);
    }
  };

  i = 0;
  while (i < lines.length - 1) {
    const tag = nextTag();
    if (!tag) break;

    if (tag.code === 0) {
      processEntity();
      const val = tag.value.toUpperCase();
      if (['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE'].includes(val)) {
        currentEntity = val;
        entityProps = {};
      } else {
        currentEntity = null;
      }
    } else if (currentEntity) {
      entityProps[tag.code] = tag.value;
    }
  }
  processEntity();

  let width = maxX > minX ? maxX - minX : 0;
  let height = maxY > minY ? maxY - minY : 0;

  if (width === 0) width = 500;
  if (height === 0) height = 300;
  if (perimeter === 0) {
    perimeter = 2 * (width + height);
  }

  const laserFeedMmMin = 1800;
  const estimatedMinutes = Math.max(1, Math.round(((perimeter / laserFeedMmMin) * 1.15)));

  return {
    width: Math.round(width),
    height: Math.round(height),
    perimeterMm: Math.round(perimeter),
    perimeterMeters: Number((perimeter / 1000).toFixed(2)),
    estimatedLaserMinutes: estimatedMinutes,
    format: 'dxf'
  };
}
