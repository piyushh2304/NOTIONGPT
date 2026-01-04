import { MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';

// Pastel colors from reference: Pink, Blue, Green, Purple, Orange
const PASTEL_COLORS = [
    '#FFB4C2', // Pink
    '#B4E4FF', // Blue
    '#B4F8C8', // Green
    '#D7B4F8', // Purple
    '#FFD4B4', // Orange
    '#F8F8B4', // Yellow
];

// Darker border/text colors corresponding to pastels
const BORDER_COLORS = [
    '#E57373', // Pink
    '#64B5F6', // Blue
    '#81C784', // Green
    '#BA68C8', // Purple
    '#FFB74D', // Orange
    '#FFF176', // Yellow
];

interface MindMapData {
    label: string;
    children?: MindMapData[];
}

export const generateMindMapData = (data: any): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Parse if string
    let parsedData: MindMapData;
    try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        console.error("Failed to parse mind map data", e);
        // Fallback or re-throw
        parsedData = { label: "Error Parsing Data" };
    }

    // --- Layout Configuration ---
    const rootX = 0;
    const rootY = 0;

    // Create Root Node
    const rootId = 'root';
    nodes.push({
        id: rootId,
        type: 'mindMapNode', // Custom node type we'll create
        position: { x: rootX, y: rootY },
        data: {
            label: parsedData.label,
            color: '#BFA2E8', // Special purple for root (from image center)
            borderColor: '#9575CD',
            isRoot: true
        },
    });

    if (!parsedData.children) return { nodes, edges };

    const children = parsedData.children;
    const count = children.length;

    // Radial Layout for Level 1
    const radius = 300; // Distance from center
    const angleStep = (2 * Math.PI) / count;

    children.forEach((child, index) => {
        const childId = `c-${index}`;
        const angle = index * angleStep;

        // Calculate position
        const x = rootX + radius * Math.cos(angle);
        const y = rootY + radius * Math.sin(angle);

        // Pick color cyclically
        const colorIndex = index % PASTEL_COLORS.length;
        const color = PASTEL_COLORS[colorIndex];
        const borderColor = BORDER_COLORS[colorIndex];

        nodes.push({
            id: childId,
            type: 'mindMapNode',
            position: { x, y },
            data: {
                label: child.label,
                color: color,
                borderColor: borderColor
            },
        });

        edges.push({
            id: `e-${rootId}-${childId}`,
            source: rootId,
            target: childId,
            type: 'default', // standard bezier
            style: { stroke: '#555', strokeWidth: 2 },
        });

        // Level 2 (Sub-children)
        if (child.children && child.children.length > 0) {
            const subCount = child.children.length;
            // Fan out range (e.g., +/- 60 degrees around the parent's angle)
            const fanAngle = Math.PI / 2; // 90 degrees fan
            // Start angle for fan
            const startAngle = angle - fanAngle / 2;
            const subAngleStep = fanAngle / (subCount + 1); // +1 to avoid edges

            const subRadius = 200;

            child.children.forEach((subChild, subIndex) => {
                const subId = `c-${index}-${subIndex}`;
                // Calculate absolute angle
                const currentAngle = startAngle + (subIndex + 1) * subAngleStep;

                const subX = x + subRadius * Math.cos(currentAngle);
                const subY = y + subRadius * Math.sin(currentAngle);

                nodes.push({
                    id: subId,
                    type: 'mindMapNode',
                    position: { x: subX, y: subY },
                    data: {
                        label: subChild.label,
                        color: color, // Inherit color from parent branch
                        borderColor: borderColor,
                        isSubNode: true
                    },
                });

                edges.push({
                    id: `e-${childId}-${subId}`,
                    source: childId,
                    target: subId,
                    type: 'smoothstep', // or bezier
                    pathOptions: { borderRadius: 20 },
                    style: { stroke: '#555', strokeWidth: 1.5 },
                });
            });
        }
    });

    return { nodes, edges };
};
