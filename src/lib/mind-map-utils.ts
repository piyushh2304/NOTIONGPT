import type { Node, Edge } from 'reactflow';

// Vibrant colors from reference
const BRANCH_COLORS = [
    { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }, // Red
    { bg: '#dcfce7', border: '#22c55e', text: '#166534' }, // Green
    { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // Blue
    { bg: '#fef9c3', border: '#facc15', text: '#854d0e' }, // Yellow
    { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' }, // Purple
    { bg: '#ffedd5', border: '#f97316', text: '#9a3412' }, // Orange
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
        parsedData = { label: "Error Parsing Data" };
    }

    const rootX = 0;
    const rootY = 0;
    const HORIZONTAL_SPACING = 500; // Increased
    const VERTICAL_SPACING_UNIT = 120; // Base unit for spacing

    // Helper to calculate total height of a branch
    const getBranchHeight = (node: MindMapData): number => {
        if (!node.children || node.children.length === 0) return 100;
        const childrenHeight = node.children.reduce((acc, child) => acc + getBranchHeight(child), 0);
        const gaps = (node.children.length - 1) * 40;
        return Math.max(100, childrenHeight + gaps);
    };

    // Create Root Node
    const rootId = 'root';
    nodes.push({
        id: rootId,
        type: 'mindMapNode',
        position: { x: rootX, y: rootY },
        data: {
            label: parsedData.label,
            isRoot: true,
            depth: 0
        },
    });

    if (!parsedData.children) return { nodes, edges };

    const children = parsedData.children;
    const midPoint = Math.ceil(children.length / 2);

    const leftChildren = children.slice(0, midPoint);
    const rightChildren = children.slice(midPoint);

    const layoutBranchSide = (branchNodes: MindMapData[], side: 'left' | 'right', startIdx: number) => {
        const branchHeights = branchNodes.map(node => getBranchHeight(node));
        const totalHeight = branchHeights.reduce((acc, h) => acc + h, 0) + (branchNodes.length - 1) * 100;

        let currentY = rootY - totalHeight / 2;

        branchNodes.forEach((child, index) => {
            const actualIdx = startIdx + index;
            const childId = `c-${actualIdx}`;
            const branchHeight = branchHeights[index];

            const x = side === 'right' ? rootX + HORIZONTAL_SPACING : rootX - HORIZONTAL_SPACING;
            const y = currentY + branchHeight / 2;

            const colorSet = BRANCH_COLORS[actualIdx % BRANCH_COLORS.length];

            nodes.push({
                id: childId,
                type: 'mindMapNode',
                position: { x, y },
                data: {
                    label: child.label,
                    side,
                    depth: 1,
                    ...colorSet
                },
            });

            // Connect root to child
            edges.push({
                id: `e-${rootId}-${childId}`,
                source: rootId,
                sourceHandle: `source-${side}`, // Explicit handle ID
                target: childId,
                targetHandle: side === 'right' ? 'target-left' : 'target-right',
                type: 'smoothstep',
                style: { stroke: colorSet.border, strokeWidth: 4, opacity: 0.8 },
                animated: true,
            });

            // Level 2 (Sub-children)
            if (child.children && child.children.length > 0) {
                const subCount = child.children.length;
                const subTotalHeight = (subCount - 1) * VERTICAL_SPACING_UNIT;
                const subStartY = y - subTotalHeight / 2;

                child.children.forEach((subChild, subIndex) => {
                    const subId = `${childId}-${subIndex}`;
                    const subX = side === 'right' ? x + (HORIZONTAL_SPACING * 0.9) : x - (HORIZONTAL_SPACING * 0.9);
                    const subY = subStartY + subIndex * VERTICAL_SPACING_UNIT;

                    nodes.push({
                        id: subId,
                        type: 'mindMapNode',
                        position: { x: subX, y: subY },
                        data: {
                            label: subChild.label,
                            side,
                            depth: 2,
                            ...colorSet
                        },
                    });

                    edges.push({
                        id: `e-${childId}-${subId}`,
                        source: childId,
                        sourceHandle: `source-${side}`, // Explicit handle ID
                        target: subId,
                        targetHandle: side === 'right' ? 'target-left' : 'target-right',
                        type: 'smoothstep',
                        style: { stroke: colorSet.border, strokeWidth: 2, opacity: 0.6 },
                    });
                });
            }

            currentY += branchHeight + 100; // Increased spacing between branches
        });
    };

    layoutBranchSide(rightChildren, 'right', midPoint);
    layoutBranchSide(leftChildren, 'left', 0);

    return { nodes, edges };
};
