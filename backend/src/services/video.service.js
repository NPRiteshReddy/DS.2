/**
 * Video Rendering Service
 * Creates professional 3Blue1Brown-style educational videos
 * Uses Manim for animations and Edge TTS for voiceover
 * Supports AI-generated custom Manim code with template fallback
 */
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// AI service for generating custom Manim code
const { generateManimCodeWithAI } = require('./ai.service');

// Directory for video outputs
const VIDEO_OUTPUT_DIR = path.join(process.cwd(), 'public', 'videos');
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Professional color scheme (3Blue1Brown inspired)
const MANIM_COLORS = {
    background: '#1a1a2e',
    primary: 'BLUE_C',
    secondary: 'GREEN_C',
    accent: 'GOLD',
    highlight: 'YELLOW',
    text: 'WHITE',
    muted: 'GRAY'
};

/**
 * Escape string for Python code
 * @param {string} str - String to escape
 * @param {number} maxLen - Maximum length
 * @returns {string} Escaped string
 */
function escapeForPython(str, maxLen = 100) {
    if (!str) return '';
    return str
        .substring(0, maxLen)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
}

/**
 * Generate Manim code for a slide based on visual description
 * Creates professional 3Blue1Brown-style animations
 * @param {Object} slide - Slide object with heading, narration, visualType, visualData
 * @param {number} slideIndex - Index of the slide
 * @param {number} duration - Duration in seconds for this slide
 * @returns {string} Manim Python code for the scene
 */
function generateManimSceneCode(slide, slideIndex, duration = 40) {
    // Use heading (from new script format) or fall back to title
    const title = slide.heading || slide.title || `Slide ${slideIndex + 1}`;

    // Determine visualization type with fallbacks
    let visualType = slide.visualType || 'animated_list';

    // Map old types to new types for backwards compatibility
    const typeMapping = {
        'brain_diagram': 'neural_network',
        'diagram': 'concept_diagram',
        'hierarchy': 'tree_hierarchy',
        'process': 'process_flow',
        'graph': 'math_graph',
        'list': 'animated_list',
        'code': 'code_walkthrough',
        'text': 'animated_list',
        'math': 'equation_derivation',
        // New type mappings
        'chart': 'bar_chart',
        'bar': 'bar_chart',
        'pie': 'pie_chart',
        'scatter': 'scatter_plot',
        'correlation': 'scatter_plot',
        'venn': 'venn_diagram',
        'sets': 'venn_diagram',
        'decision': 'flowchart',
        'decision_tree': 'flowchart',
        'mindmap': 'mind_map',
        'brainstorm': 'mind_map',
        'table': 'matrix_table',
        'matrix': 'matrix_table',
        'grid': 'matrix_table',
        '3d': '3d_surface',
        'surface': '3d_surface',
        'circuit': 'circuit_diagram',
        'logic': 'circuit_diagram',
        'gates': 'circuit_diagram',
        'dna': 'dna_helix',
        'helix': 'dna_helix',
        'biology': 'dna_helix',
        'genetics': 'dna_helix'
    };

    visualType = typeMapping[visualType] || visualType;

    // Generate appropriate Manim scene based on type
    return generateVisualization(visualType, slide, slideIndex, duration);
}

/**
 * Generate professional Manim visualization code based on type
 * Creates 3Blue1Brown-style educational animations
 */
function generateVisualization(type, slide, slideIndex, duration) {
    const title = escapeForPython(slide.heading || slide.title || `Slide ${slideIndex + 1}`, 60);
    const className = `Slide${slideIndex}Scene`;
    const visualData = slide.visualData || {};

    // Extract bullet points with fallbacks
    const bullets = slide.bulletPoints ||
        (slide.narration || '').split('. ')
            .filter(s => s.length > 10)
            .slice(0, 4)
            .map(s => escapeForPython(s.trim(), 50));

    // Calculate animation time vs wait time
    const animTime = Math.min(duration * 0.6, 20); // Max 20s for animations
    const waitTime = Math.max(1, duration - animTime);

    switch (type) {
        case 'neural_network':
            return generateNeuralNetworkScene(className, title, visualData, bullets, waitTime);

        case 'tree_hierarchy':
            return generateTreeHierarchyScene(className, title, visualData, bullets, waitTime);

        case 'math_graph':
            return generateMathGraphScene(className, title, visualData, waitTime);

        case 'animated_list':
            return generateAnimatedListScene(className, title, visualData, bullets, waitTime);

        case 'code_walkthrough':
            return generateCodeWalkthroughScene(className, title, visualData, waitTime);

        case 'concept_diagram':
            return generateConceptDiagramScene(className, title, visualData, bullets, waitTime);

        case 'timeline':
            return generateTimelineScene(className, title, visualData, waitTime);

        case 'comparison':
            return generateComparisonScene(className, title, visualData, waitTime);

        case 'process_flow':
            return generateProcessFlowScene(className, title, visualData, waitTime);

        case 'equation_derivation':
            return generateEquationDerivationScene(className, title, visualData, waitTime);

        // NEW VISUALIZATION TYPES
        case 'bar_chart':
            return generateBarChartScene(className, title, visualData, waitTime);

        case 'pie_chart':
            return generatePieChartScene(className, title, visualData, waitTime);

        case 'scatter_plot':
            return generateScatterPlotScene(className, title, visualData, waitTime);

        case 'venn_diagram':
            return generateVennDiagramScene(className, title, visualData, waitTime);

        case 'flowchart':
            return generateFlowchartScene(className, title, visualData, waitTime);

        case 'mind_map':
            return generateMindMapScene(className, title, visualData, bullets, waitTime);

        case 'matrix_table':
            return generateMatrixTableScene(className, title, visualData, waitTime);

        case '3d_surface':
            return generate3DSurfaceScene(className, title, visualData, waitTime);

        case 'circuit_diagram':
            return generateCircuitDiagramScene(className, title, visualData, waitTime);

        case 'dna_helix':
            return generateDNAHelixScene(className, title, visualData, waitTime);

        default:
            return generateAnimatedListScene(className, title, visualData, bullets, waitTime);
    }
}

// ============================================
// PROFESSIONAL SCENE GENERATORS
// ============================================

/**
 * Neural Network Scene - Professional layered network with signal flow
 */
function generateNeuralNetworkScene(className, title, visualData, bullets, waitTime) {
    const layers = visualData.layers || [3, 5, 5, 2];
    const labels = visualData.labels || ['Input', 'Hidden', 'Output'];
    const showSignal = visualData.showSignalFlow !== false;

    return `
class ${className}(Scene):
    def construct(self):
        # Title with elegant animation
        title = Text("${title}", font_size=44, color=BLUE_C)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Build neural network
        layers = ${JSON.stringify(layers)}
        layer_positions = np.linspace(-5, 5, len(layers))

        all_nodes = VGroup()
        all_edges = VGroup()

        # Create nodes with proper spacing
        node_radius = 0.22
        for i, (num_nodes, x_pos) in enumerate(zip(layers, layer_positions)):
            layer = VGroup()
            max_height = 3.5
            spacing = min(0.9, max_height / max(num_nodes, 1))
            y_positions = [(j - (num_nodes - 1) / 2) * spacing for j in range(num_nodes)]

            for y_pos in y_positions:
                # Color: blue for input, green for output, white for hidden
                if i == 0:
                    color = BLUE_C
                elif i == len(layers) - 1:
                    color = GREEN_C
                else:
                    color = WHITE
                node = Circle(radius=node_radius, color=color, fill_opacity=0.4, stroke_width=2)
                node.move_to([x_pos, y_pos, 0])
                layer.add(node)
            all_nodes.add(layer)

        # Create edges with subtle opacity
        for i in range(len(layers) - 1):
            for node1 in all_nodes[i]:
                for node2 in all_nodes[i + 1]:
                    edge = Line(
                        node1.get_center(), node2.get_center(),
                        color=GRAY, stroke_width=0.8, stroke_opacity=0.35
                    )
                    all_edges.add(edge)

        # Animate construction - edges first, then nodes
        self.play(Create(all_edges), run_time=2)
        self.play(LaggedStart(*[Create(layer) for layer in all_nodes], lag_ratio=0.2), run_time=2)

        # Add layer labels
        labels_text = ${JSON.stringify(labels)}
        label_objs = VGroup()
        positions = [all_nodes[0], all_nodes[len(all_nodes)//2], all_nodes[-1]]
        for lbl, pos_group in zip(labels_text[:3], positions[:len(labels_text)]):
            label = Text(lbl, font_size=18, color=GRAY)
            label.next_to(pos_group, DOWN, buff=0.4)
            label_objs.add(label)

        self.play(FadeIn(label_objs), run_time=1)

        ${showSignal ? `
        # Animate signal flow through network
        for _ in range(2):
            signal = Dot(color=GOLD, radius=0.18)
            start_node = all_nodes[0][len(all_nodes[0])//2]
            signal.move_to(start_node.get_center())
            self.add(signal)

            for layer in list(all_nodes)[1:]:
                target = layer[len(layer)//2]
                self.play(signal.animate.move_to(target.get_center()), run_time=0.5)

            self.play(FadeOut(signal), run_time=0.3)
        ` : ''}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Tree Hierarchy Scene - Professional tree structure with animations
 */
function generateTreeHierarchyScene(className, title, visualData, bullets, waitTime) {
    const rootLabel = escapeForPython(visualData.rootLabel || 'Main Concept', 30);
    const children = visualData.children || [
        { label: 'Branch 1', children: ['Item A', 'Item B'] },
        { label: 'Branch 2', children: ['Item C', 'Item D'] }
    ];

    // Build children code
    let childrenCode = '';
    let nodeCount = 0;
    const colors = ['BLUE_C', 'GREEN_C', 'ORANGE', 'PURPLE', 'TEAL'];

    children.forEach((child, i) => {
        const color = colors[i % colors.length];
        const label = escapeForPython(child.label || `Branch ${i + 1}`, 25);
        childrenCode += `
        # Branch ${i + 1}
        branch${i} = VGroup(
            RoundedRectangle(height=0.8, width=2.8, corner_radius=0.15, color=${color}, fill_opacity=0.3),
            Text("${label}", font_size=18, color=${color})
        ).move_to([${(i - (children.length - 1) / 2) * 3.5}, 0.5, 0])
        branches.add(branch${i})
        `;

        if (child.children && Array.isArray(child.children)) {
            child.children.slice(0, 3).forEach((leaf, j) => {
                const leafLabel = escapeForPython(typeof leaf === 'string' ? leaf : leaf.label || `Leaf ${j + 1}`, 20);
                childrenCode += `
        leaf${nodeCount} = VGroup(
            RoundedRectangle(height=0.6, width=2.2, corner_radius=0.1, color=GRAY, fill_opacity=0.2),
            Text("${leafLabel}", font_size=14, color=WHITE)
        ).move_to([${(i - (children.length - 1) / 2) * 3.5 + (j - 1) * 1.2}, -1.5, 0])
        leaves.add(leaf${nodeCount})
        branch${i}_leaves.add(leaf${nodeCount})
        `;
                nodeCount++;
            });
            childrenCode += `
        branch_leaf_map[${i}] = branch${i}_leaves
        branch${i}_leaves = VGroup()
        `;
        }
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Root node
        root = VGroup(
            RoundedRectangle(height=1, width=3.5, corner_radius=0.2, color=GOLD, fill_opacity=0.4),
            Text("${rootLabel}", font_size=22, color=GOLD)
        ).shift(UP * 2)

        self.play(Create(root), run_time=1)

        # Branch nodes
        branches = VGroup()
        leaves = VGroup()
        branch_leaf_map = {}
${children.map((_, i) => `        branch${i}_leaves = VGroup()`).join('\n')}

${childrenCode}

        # Animate branches with connecting lines
        for i, branch in enumerate(branches):
            line = Line(root.get_bottom(), branch.get_top(), color=GRAY, stroke_width=2)
            self.play(Create(line), FadeIn(branch), run_time=0.7)

        self.wait(1)

        # Animate leaves
        for leaf in leaves:
            self.play(FadeIn(leaf, shift=DOWN * 0.3), run_time=0.4)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Math Graph Scene - Professional axes with multiple functions
 */
function generateMathGraphScene(className, title, visualData, waitTime) {
    const functions = visualData.functions || [
        { expression: 'x**2', label: 'f(x) = x²', color: 'BLUE' }
    ];
    const xRange = visualData.xRange || [-5, 5];
    const yRange = visualData.yRange || [0, 25];
    const xLabel = escapeForPython(visualData.xLabel || 'x', 20);
    const yLabel = escapeForPython(visualData.yLabel || 'y', 20);

    // Build function plotting code
    let funcCode = '';
    const colorMap = {
        'blue': 'BLUE', 'green': 'GREEN', 'red': 'RED', 'orange': 'ORANGE',
        'purple': 'PURPLE', 'yellow': 'YELLOW', 'teal': 'TEAL'
    };

    functions.slice(0, 4).forEach((func, i) => {
        const expr = func.expression || 'x';
        const label = escapeForPython(func.label || `f${i}(x)`, 30);
        const color = colorMap[(func.color || '').toLowerCase()] || ['BLUE', 'GREEN', 'ORANGE', 'PURPLE'][i];

        funcCode += `
        # Function ${i + 1}
        func${i} = axes.plot(lambda x: ${expr}, color=${color}, x_range=[${xRange[0]}, ${xRange[1]}])
        label${i} = Text("${label}", font_size=18, color=${color})
        label${i}.next_to(func${i}, UR, buff=0.2)
        self.play(Create(func${i}), run_time=1.5)
        self.play(FadeIn(label${i}), run_time=0.5)
        self.wait(1)
        `;
    });

    // Calculate tick values for axes
    const xStep = Math.ceil((xRange[1] - xRange[0]) / 5);
    const yStep = Math.ceil((yRange[1] - yRange[0]) / 5);

    // Generate x-axis tick labels
    let xTicks = [];
    for (let x = xRange[0]; x <= xRange[1]; x += xStep) {
        xTicks.push(x);
    }

    // Generate y-axis tick labels
    let yTicks = [];
    for (let y = yRange[0]; y <= yRange[1]; y += yStep) {
        yTicks.push(y);
    }

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Create axes with proper configuration
        axes = Axes(
            x_range=[${xRange[0]}, ${xRange[1]}, ${xStep}],
            y_range=[${yRange[0]}, ${yRange[1]}, ${yStep}],
            x_length=10,
            y_length=5,
            tips=False,
            axis_config={"include_ticks": True, "tick_size": 0.1}
        ).set_color(GRAY).shift(DOWN * 0.3)

        # Axis labels
        x_label = Text("${xLabel}", font_size=18).next_to(axes.x_axis, RIGHT, buff=0.2)
        y_label = Text("${yLabel}", font_size=18).next_to(axes.y_axis, UP, buff=0.2)

        # Add tick value labels using Text (avoids LaTeX dependency)
        x_tick_labels = VGroup()
        for val in [${xTicks.join(', ')}]:
            tick_label = Text(str(int(val)), font_size=14, color=GRAY)
            tick_label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_tick_labels.add(tick_label)

        y_tick_labels = VGroup()
        for val in [${yTicks.join(', ')}]:
            if val != 0:  # Skip 0 to avoid overlap
                tick_label = Text(str(int(val)), font_size=14, color=GRAY)
                tick_label.next_to(axes.c2p(0, val), LEFT, buff=0.15)
                y_tick_labels.add(tick_label)

        self.play(Create(axes), run_time=1.5)
        self.play(FadeIn(x_label), FadeIn(y_label), FadeIn(x_tick_labels), FadeIn(y_tick_labels), run_time=0.5)

${funcCode}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Animated List Scene - Professional bullet points with icons
 */
function generateAnimatedListScene(className, title, visualData, bullets, waitTime) {
    const items = visualData.items || bullets.map(b => ({ text: b, icon: 'arrow' }));
    const style = visualData.style || 'cascade';

    // Icon mapping
    const iconMap = {
        'arrow': '→',
        'star': '★',
        'check': '✓',
        'dot': '•',
        'number': ''
    };

    let itemsCode = '';
    items.slice(0, 6).forEach((item, i) => {
        const text = escapeForPython(typeof item === 'string' ? item : item.text || `Point ${i + 1}`, 55);
        const icon = iconMap[(item.icon || 'arrow')] || '→';
        const prefix = icon === '' ? `${i + 1}.` : icon;

        itemsCode += `
        item${i} = VGroup(
            Text("${prefix}", font_size=28, color=GOLD),
            Text("${text}", font_size=26, color=WHITE)
        ).arrange(RIGHT, buff=0.3)
        items.add(item${i})
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        items = VGroup()
${itemsCode}

        items.arrange(DOWN, aligned_edge=LEFT, buff=0.5)
        items.shift(DOWN * 0.3)

        # Animate items ${style === 'cascade' ? 'with cascade effect' : 'simultaneously'}
        ${style === 'cascade' ? `
        for item in items:
            self.play(FadeIn(item, shift=RIGHT * 0.5), run_time=0.7)
            self.wait(0.4)
        ` : `
        self.play(LaggedStart(*[FadeIn(item, shift=RIGHT * 0.5) for item in items], lag_ratio=0.15), run_time=2)
        `}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Code Walkthrough Scene - Syntax highlighted code with annotations
 */
function generateCodeWalkthroughScene(className, title, visualData, waitTime) {
    const language = visualData.language || 'python';
    let code = visualData.code || '# Example code\\ndef hello():\\n    print("Hello, World!")';
    const highlights = visualData.highlights || [];

    // Clean code for Python string
    code = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");

    let highlightCode = '';
    highlights.slice(0, 3).forEach((hl, i) => {
        const lines = hl.lines || [1];
        const label = escapeForPython(hl.label || 'Important', 40);
        highlightCode += `
        # Highlight ${i + 1}
        try:
            highlight_rect${i} = SurroundingRectangle(
                code_block.code[${lines[0] - 1}],
                color=GOLD,
                buff=0.08,
                fill_opacity=0.15
            )
            annotation${i} = Text("${label}", font_size=16, color=GOLD)
            annotation${i}.next_to(highlight_rect${i}, RIGHT, buff=0.4)
            self.play(Create(highlight_rect${i}), FadeIn(annotation${i}), run_time=0.8)
            self.wait(2)
            self.play(FadeOut(highlight_rect${i}), FadeOut(annotation${i}), run_time=0.4)
        except:
            pass
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Code with syntax highlighting
        code_str = """${code}"""

        code_block = Code(
            code=code_str,
            language="${language}",
            font="Monospace",
            font_size=22,
            background="rectangle",
            background_stroke_width=1,
            background_stroke_color=GRAY,
            insert_line_no=True,
            line_spacing=0.6
        ).scale(0.85).shift(DOWN * 0.3)

        self.play(FadeIn(code_block), run_time=1.5)
        self.wait(1.5)

${highlightCode}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Concept Diagram Scene - Central concept with related ideas
 */
function generateConceptDiagramScene(className, title, visualData, bullets, waitTime) {
    const centerConcept = escapeForPython(visualData.centerConcept || 'Main Concept', 25);
    const relatedConcepts = visualData.relatedConcepts || bullets.map(b => ({ label: b, connection: 'relates to' }));

    let conceptsCode = '';
    const colors = ['BLUE_C', 'GREEN_C', 'ORANGE', 'PURPLE', 'TEAL', 'RED_C'];

    relatedConcepts.slice(0, 6).forEach((concept, i) => {
        const label = escapeForPython(typeof concept === 'string' ? concept : concept.label || `Related ${i + 1}`, 25);
        const connection = escapeForPython(concept.connection || '', 20);
        const color = colors[i % colors.length];
        const angle = (i * 2 * Math.PI / Math.min(relatedConcepts.length, 6)) - Math.PI / 2;
        const x = 3.2 * Math.cos(angle);
        const y = 3.2 * Math.sin(angle);

        conceptsCode += `
        # Related concept ${i + 1}
        concept${i} = VGroup(
            Circle(radius=0.7, color=${color}, fill_opacity=0.3),
            Text("${label}", font_size=16, color=${color})
        ).move_to([${x.toFixed(2)}, ${y.toFixed(2)}, 0])

        line${i} = Line(center.get_center(), concept${i}.get_center() * 0.7, color=GRAY, stroke_width=2)
        ${connection ? `conn_label${i} = Text("${connection}", font_size=12, color=GRAY).move_to(line${i}.get_center()).shift(UP * 0.2)` : ''}

        concepts.add(concept${i})
        lines.add(line${i})
        ${connection ? `labels.add(conn_label${i})` : ''}
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Central concept
        center = VGroup(
            Circle(radius=1.1, color=GOLD, fill_opacity=0.4),
            Text("${centerConcept}", font_size=20, color=GOLD)
        )

        self.play(Create(center), run_time=1)

        concepts = VGroup()
        lines = VGroup()
        labels = VGroup()

${conceptsCode}

        # Animate connections
        for line, concept in zip(lines, concepts):
            self.play(Create(line), FadeIn(concept), run_time=0.6)

        if len(labels) > 0:
            self.play(FadeIn(labels), run_time=0.5)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Timeline Scene - Horizontal timeline with events
 */
function generateTimelineScene(className, title, visualData, waitTime) {
    const events = visualData.events || [
        { year: '2020', label: 'Start', description: 'Beginning' },
        { year: '2022', label: 'Growth', description: 'Expansion' },
        { year: '2024', label: 'Today', description: 'Current' }
    ];

    let eventsCode = '';
    const colors = ['BLUE', 'GREEN', 'ORANGE', 'PURPLE', 'RED', 'TEAL'];

    events.slice(0, 6).forEach((event, i) => {
        const year = escapeForPython(event.year || `${2020 + i}`, 10);
        const label = escapeForPython(event.label || `Event ${i + 1}`, 20);
        const desc = escapeForPython(event.description || '', 30);
        const color = colors[i % colors.length];
        const xPos = -5.5 + (i * 11 / Math.max(events.length - 1, 1));

        eventsCode += `
        # Event ${i + 1}
        dot${i} = Dot(point=[${xPos.toFixed(2)}, -0.5, 0], color=${color}, radius=0.15)
        year${i} = Text("${year}", font_size=18, color=${color})
        year${i}.next_to(dot${i}, UP, buff=0.3)
        label${i} = Text("${label}", font_size=16, color=WHITE)
        label${i}.next_to(dot${i}, DOWN, buff=0.3)
        ${desc ? `desc${i} = Text("${desc}", font_size=12, color=GRAY)
        desc${i}.next_to(label${i}, DOWN, buff=0.15)` : ''}

        event_group${i} = VGroup(dot${i}, year${i}, label${i}${desc ? `, desc${i}` : ''})
        events.add(event_group${i})
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Main timeline line
        timeline = Line(LEFT * 6, RIGHT * 6, color=WHITE, stroke_width=3)
        timeline.shift(DOWN * 0.5)
        self.play(Create(timeline), run_time=1)

        events = VGroup()

${eventsCode}

        # Animate events appearing
        for event_group in events:
            self.play(Create(event_group), run_time=0.8)
            self.wait(0.5)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Comparison Scene - Side by side comparison
 */
function generateComparisonScene(className, title, visualData, waitTime) {
    const items = visualData.items || [
        { name: 'Option A', pros: ['Fast', 'Simple'], cons: ['Limited'] },
        { name: 'Option B', pros: ['Powerful'], cons: ['Complex'] }
    ];
    const layout = visualData.layout || 'side_by_side';

    let itemsCode = '';
    items.slice(0, 2).forEach((item, i) => {
        const name = escapeForPython(item.name || `Option ${i + 1}`, 20);
        const pros = (item.pros || []).slice(0, 3).map(p => escapeForPython(p, 25));
        const cons = (item.cons || []).slice(0, 3).map(c => escapeForPython(c, 25));
        const xPos = i === 0 ? -3.5 : 3.5;
        const color = i === 0 ? 'BLUE_C' : 'GREEN_C';

        itemsCode += `
        # Item ${i + 1}: ${name}
        box${i} = RoundedRectangle(height=4.5, width=5.5, corner_radius=0.2, color=${color}, fill_opacity=0.15)
        box${i}.shift(RIGHT * ${xPos})

        header${i} = Text("${name}", font_size=26, color=${color})
        header${i}.move_to(box${i}.get_top() + DOWN * 0.4)

        pros_header${i} = Text("Pros:", font_size=18, color=GREEN)
        pros_header${i}.next_to(header${i}, DOWN, buff=0.4).align_to(box${i}, LEFT).shift(RIGHT * 0.3)

        pros_list${i} = VGroup(
${pros.map((p, j) => `            Text("✓ ${p}", font_size=16, color=WHITE)`).join(',\n') || '            Text("✓ None", font_size=16, color=GRAY)'}
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).next_to(pros_header${i}, DOWN, buff=0.2).align_to(pros_header${i}, LEFT)

        cons_header${i} = Text("Cons:", font_size=18, color=RED)
        cons_header${i}.next_to(pros_list${i}, DOWN, buff=0.3).align_to(box${i}, LEFT).shift(RIGHT * 0.3)

        cons_list${i} = VGroup(
${cons.map((c, j) => `            Text("✗ ${c}", font_size=16, color=WHITE)`).join(',\n') || '            Text("✗ None", font_size=16, color=GRAY)'}
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).next_to(cons_header${i}, DOWN, buff=0.2).align_to(cons_header${i}, LEFT)

        item${i} = VGroup(box${i}, header${i}, pros_header${i}, pros_list${i}, cons_header${i}, cons_list${i})
        items.add(item${i})
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        items = VGroup()

${itemsCode}

        # Animate items
        for item in items:
            self.play(Create(item), run_time=1.2)
            self.wait(0.5)

        # VS label
        vs = Text("VS", font_size=32, color=GOLD)
        self.play(Write(vs), run_time=0.5)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Process Flow Scene - Connected steps with arrows
 */
function generateProcessFlowScene(className, title, visualData, waitTime) {
    const steps = visualData.steps || [
        { label: 'Input', description: 'Data enters' },
        { label: 'Process', description: 'Transform' },
        { label: 'Output', description: 'Results' }
    ];
    const showArrows = visualData.showArrows !== false;

    let stepsCode = '';
    const colors = ['BLUE_C', 'GREEN_C', 'ORANGE', 'PURPLE', 'TEAL'];

    steps.slice(0, 5).forEach((step, i) => {
        const label = escapeForPython(step.label || `Step ${i + 1}`, 20);
        const desc = escapeForPython(step.description || '', 30);
        const color = colors[i % colors.length];
        const xPos = -5 + (i * 10 / Math.max(steps.length - 1, 1));

        stepsCode += `
        # Step ${i + 1}
        box${i} = RoundedRectangle(height=1.6, width=2.5, corner_radius=0.15, color=${color}, fill_opacity=0.3)
        box${i}.move_to([${xPos.toFixed(2)}, 0, 0])
        label${i} = Text("${label}", font_size=20, color=${color})
        label${i}.move_to(box${i})
        ${desc ? `desc${i} = Text("${desc}", font_size=14, color=GRAY)
        desc${i}.next_to(box${i}, DOWN, buff=0.2)` : ''}

        step${i} = VGroup(box${i}, label${i}${desc ? `, desc${i}` : ''})
        steps.add(step${i})
        boxes.add(box${i})
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        steps = VGroup()
        boxes = VGroup()
        arrows = VGroup()

${stepsCode}

        # Animate steps with arrows
        for i, step in enumerate(steps):
            self.play(Create(step), run_time=0.8)
            ${showArrows ? `
            if i < len(boxes) - 1:
                arrow = Arrow(boxes[i].get_right(), boxes[i + 1].get_left(), buff=0.15, color=GOLD)
                arrows.add(arrow)
                self.play(Create(arrow), run_time=0.4)
            ` : ''}
            self.wait(0.3)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Equation Derivation Scene - Step by step equations
 */
function generateEquationDerivationScene(className, title, visualData, waitTime) {
    const steps = visualData.steps || ['E = mc^2'];
    const explanations = visualData.explanations || [];

    let eqCode = '';
    steps.slice(0, 6).forEach((step, i) => {
        const eq = escapeForPython(step, 50);
        const expl = escapeForPython(explanations[i] || '', 40);

        eqCode += `
        # Step ${i + 1} - Using Text instead of MathTex to avoid LaTeX dependency
        eq${i} = Text("${eq}", font_size=42, color=WHITE)
        eq${i}.move_to(ORIGIN)

        ${i === 0 ? `
        self.play(Write(eq${i}), run_time=1.5)
        ` : `
        self.play(ReplacementTransform(eq${i - 1}, eq${i}), run_time=1.2)
        `}

        ${expl ? `
        expl${i} = Text("${expl}", font_size=22, color=GOLD)
        expl${i}.next_to(eq${i}, DOWN, buff=0.6)
        self.play(FadeIn(expl${i}, shift=UP * 0.3), run_time=0.6)
        self.wait(2)
        self.play(FadeOut(expl${i}), run_time=0.4)
        ` : `
        self.wait(1.5)
        `}
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

${eqCode}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

// ============================================
// NEW VISUALIZATION TYPES (10 NEW SCENES)
// ============================================

/**
 * Bar Chart Scene - Animated bar chart with labels and values
 */
function generateBarChartScene(className, title, visualData, waitTime) {
    const data = visualData.data || [
        { label: 'A', value: 30, color: 'BLUE' },
        { label: 'B', value: 50, color: 'GREEN' },
        { label: 'C', value: 40, color: 'ORANGE' },
        { label: 'D', value: 25, color: 'PURPLE' }
    ];
    const yLabel = escapeForPython(visualData.yLabel || 'Value', 20);
    const xLabel = escapeForPython(visualData.xLabel || 'Category', 20);
    const showValues = visualData.showValues !== false;

    let barsCode = '';
    const colors = ['BLUE_C', 'GREEN_C', 'ORANGE', 'PURPLE', 'TEAL', 'RED_C', 'YELLOW'];
    const maxValue = Math.max(...data.map(d => d.value || 50));

    data.slice(0, 7).forEach((item, i) => {
        const label = escapeForPython(item.label || `Cat ${i + 1}`, 15);
        const value = item.value || 30;
        const color = colors[i % colors.length];
        const height = (value / maxValue) * 4;
        const xPos = -4 + (i * 8 / Math.max(data.length - 1, 1));

        barsCode += `
        # Bar ${i + 1}
        bar${i} = Rectangle(height=${height.toFixed(2)}, width=0.8, color=${color}, fill_opacity=0.7)
        bar${i}.move_to([${xPos.toFixed(2)}, ${(height / 2 - 1.5).toFixed(2)}, 0])
        label${i} = Text("${label}", font_size=16, color=WHITE)
        label${i}.next_to(bar${i}, DOWN, buff=0.2)
        ${showValues ? `value${i} = Text("${value}", font_size=14, color=${color})
        value${i}.next_to(bar${i}, UP, buff=0.15)` : ''}
        bars.add(VGroup(bar${i}, label${i}${showValues ? `, value${i}` : ''}))
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Y-axis
        y_axis = Line(DOWN * 2, UP * 3, color=GRAY, stroke_width=2).shift(LEFT * 5)
        y_label = Text("${yLabel}", font_size=16, color=GRAY).next_to(y_axis, UP, buff=0.2)
        self.play(Create(y_axis), FadeIn(y_label), run_time=0.8)

        # X-axis
        x_axis = Line(LEFT * 5, RIGHT * 5, color=GRAY, stroke_width=2).shift(DOWN * 1.5)
        x_label = Text("${xLabel}", font_size=16, color=GRAY).next_to(x_axis, RIGHT, buff=0.2)
        self.play(Create(x_axis), FadeIn(x_label), run_time=0.8)

        bars = VGroup()

${barsCode}

        # Animate bars growing from bottom
        for bar_group in bars:
            bar = bar_group[0]
            original_height = bar.height
            bar.stretch_to_fit_height(0.01)
            bar.align_to(x_axis, DOWN)
            self.play(
                bar.animate.stretch_to_fit_height(original_height).shift(UP * original_height / 2),
                *[FadeIn(obj) for obj in bar_group[1:]],
                run_time=0.6
            )

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Pie Chart Scene - Animated pie chart with sectors and legend
 */
function generatePieChartScene(className, title, visualData, waitTime) {
    const data = visualData.data || [
        { label: 'Category A', value: 35, color: 'BLUE' },
        { label: 'Category B', value: 25, color: 'GREEN' },
        { label: 'Category C', value: 20, color: 'ORANGE' },
        { label: 'Category D', value: 20, color: 'PURPLE' }
    ];
    const showPercentages = visualData.showPercentages !== false;
    const radius = visualData.radius || 2.2;

    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    const colors = ['BLUE_C', 'GREEN_C', 'ORANGE', 'PURPLE', 'TEAL', 'RED_C', 'YELLOW', 'PINK'];

    let sectorsCode = '';
    let currentAngle = 90; // Start from top

    data.slice(0, 8).forEach((item, i) => {
        const label = escapeForPython(item.label || `Segment ${i + 1}`, 20);
        const value = item.value || 10;
        const percentage = ((value / total) * 100).toFixed(1);
        const angleSize = (value / total) * 360;
        const color = colors[i % colors.length];
        const midAngle = (currentAngle - angleSize / 2) * Math.PI / 180;
        const labelX = Math.cos(midAngle) * (radius + 0.8);
        const labelY = Math.sin(midAngle) * (radius + 0.8);

        sectorsCode += `
        # Sector ${i + 1}: ${label}
        sector${i} = AnnularSector(
            inner_radius=0,
            outer_radius=${radius},
            angle=${(angleSize * Math.PI / 180).toFixed(4)},
            start_angle=${(currentAngle * Math.PI / 180).toFixed(4)},
            color=${color},
            fill_opacity=0.8
        ).shift(LEFT * 1.5)

        ${showPercentages ? `pct${i} = Text("${percentage}%", font_size=16, color=WHITE)
        pct${i}.move_to(sector${i}.get_center() + np.array([${(Math.cos(midAngle) * radius * 0.6).toFixed(2)}, ${(Math.sin(midAngle) * radius * 0.6).toFixed(2)}, 0]))` : ''}

        sectors.add(sector${i})
        ${showPercentages ? `pcts.add(pct${i})` : ''}

        # Legend entry
        legend${i} = VGroup(
            Square(side_length=0.3, color=${color}, fill_opacity=0.8),
            Text("${label}", font_size=14, color=WHITE)
        ).arrange(RIGHT, buff=0.2)
        legend_items.add(legend${i})
        `;

        currentAngle -= angleSize;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        sectors = VGroup()
        pcts = VGroup()
        legend_items = VGroup()

${sectorsCode}

        # Animate sectors appearing
        for sector in sectors:
            self.play(Create(sector), run_time=0.5)

        ${showPercentages ? 'self.play(FadeIn(pcts), run_time=0.8)' : ''}

        # Position and show legend
        legend_items.arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        legend_items.to_edge(RIGHT, buff=0.5)
        self.play(FadeIn(legend_items), run_time=1)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Scatter Plot Scene - Points with optional trend line
 */
function generateScatterPlotScene(className, title, visualData, waitTime) {
    const points = visualData.points || [
        { x: 1, y: 2 }, { x: 2, y: 3.5 }, { x: 3, y: 3 }, { x: 4, y: 5 },
        { x: 5, y: 4.5 }, { x: 6, y: 6 }, { x: 7, y: 5.5 }, { x: 8, y: 7 }
    ];
    const showTrendLine = visualData.showTrendLine !== false;
    const xLabel = escapeForPython(visualData.xLabel || 'X', 15);
    const yLabel = escapeForPython(visualData.yLabel || 'Y', 15);
    const pointColor = visualData.pointColor || 'BLUE_C';

    // Calculate simple linear regression for trend line
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    let pointsCode = '';
    points.slice(0, 20).forEach((point, i) => {
        pointsCode += `
        point${i} = Dot(point=axes.c2p(${point.x}, ${point.y}), color=${pointColor}, radius=0.1)
        points.add(point${i})
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Create axes
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=8,
            y_length=5,
            tips=False
        ).set_color(GRAY).shift(DOWN * 0.3)

        x_label = Text("${xLabel}", font_size=18).next_to(axes.x_axis, RIGHT, buff=0.2)
        y_label = Text("${yLabel}", font_size=18).next_to(axes.y_axis, UP, buff=0.2)

        self.play(Create(axes), FadeIn(x_label), FadeIn(y_label), run_time=1.5)

        points = VGroup()

${pointsCode}

        # Animate points appearing
        self.play(LaggedStart(*[Create(p) for p in points], lag_ratio=0.1), run_time=2)

        ${showTrendLine ? `
        # Trend line
        trend_line = axes.plot(lambda x: ${slope.toFixed(4)} * x + ${intercept.toFixed(4)}, color=RED, x_range=[0.5, 9.5])
        trend_label = Text("Trend", font_size=16, color=RED).next_to(trend_line, UP, buff=0.3)
        self.play(Create(trend_line), FadeIn(trend_label), run_time=1.5)
        ` : ''}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Venn Diagram Scene - Overlapping circles showing set relationships
 */
function generateVennDiagramScene(className, title, visualData, waitTime) {
    const sets = visualData.sets || [
        { label: 'Set A', items: ['Item 1', 'Item 2'] },
        { label: 'Set B', items: ['Item 3', 'Item 4'] }
    ];
    const intersection = escapeForPython(visualData.intersection || 'Common', 20);
    const showIntersection = visualData.showIntersection !== false;

    const isThreeSets = sets.length >= 3;
    const colors = ['BLUE_C', 'GREEN_C', 'RED_C'];

    let setsCode = '';
    sets.slice(0, 3).forEach((set, i) => {
        const label = escapeForPython(set.label || `Set ${String.fromCharCode(65 + i)}`, 20);
        const color = colors[i];
        let xPos, yPos;

        if (isThreeSets) {
            const angle = (i * 120 - 90) * Math.PI / 180;
            xPos = Math.cos(angle) * 1.2;
            yPos = Math.sin(angle) * 1.2;
        } else {
            xPos = i === 0 ? -1.5 : 1.5;
            yPos = 0;
        }

        setsCode += `
        # Set ${i + 1}: ${label}
        circle${i} = Circle(radius=2, color=${color}, fill_opacity=0.25, stroke_width=3)
        circle${i}.move_to([${xPos.toFixed(2)}, ${yPos.toFixed(2)}, 0])
        label${i} = Text("${label}", font_size=22, color=${color})
        label${i}.next_to(circle${i}, UP if ${i} == 0 else DOWN, buff=0.3)
        sets.add(VGroup(circle${i}, label${i}))
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        sets = VGroup()

${setsCode}

        # Animate sets appearing
        for s in sets:
            self.play(Create(s[0]), FadeIn(s[1]), run_time=0.8)
            self.wait(0.3)

        ${showIntersection ? `
        # Highlight intersection
        intersection_label = Text("${intersection}", font_size=18, color=GOLD)
        intersection_label.move_to(ORIGIN)
        self.play(FadeIn(intersection_label, scale=1.2), run_time=0.8)
        ` : ''}

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Flowchart Scene - Decision tree with diamond decisions and rectangular steps
 */
function generateFlowchartScene(className, title, visualData, waitTime) {
    const nodes = visualData.nodes || [
        { type: 'start', label: 'Start' },
        { type: 'process', label: 'Process Data' },
        { type: 'decision', label: 'Valid?' },
        { type: 'process', label: 'Continue' },
        { type: 'end', label: 'End' }
    ];

    let nodesCode = '';
    let yPos = 2.5;

    nodes.slice(0, 6).forEach((node, i) => {
        const label = escapeForPython(node.label || `Step ${i + 1}`, 20);
        const type = node.type || 'process';

        let shapeCode;
        switch (type) {
            case 'start':
            case 'end':
                shapeCode = `RoundedRectangle(height=0.8, width=2.5, corner_radius=0.4, color=GREEN_C if "${type}" == "start" else RED_C, fill_opacity=0.4)`;
                break;
            case 'decision':
                shapeCode = `Square(side_length=1.5, color=GOLD, fill_opacity=0.3).rotate(PI/4)`;
                break;
            default:
                shapeCode = `Rectangle(height=0.9, width=3, color=BLUE_C, fill_opacity=0.3)`;
        }

        nodesCode += `
        # Node ${i + 1}: ${label}
        shape${i} = ${shapeCode}
        shape${i}.move_to([0, ${yPos.toFixed(2)}, 0])
        text${i} = Text("${label}", font_size=${type === 'decision' ? 14 : 18}, color=WHITE)
        text${i}.move_to(shape${i})
        node${i} = VGroup(shape${i}, text${i})
        nodes.add(node${i})
        `;

        yPos -= 1.3;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.3)
        self.play(Write(title), run_time=1.5)

        nodes = VGroup()
        arrows = VGroup()

${nodesCode}

        # Animate nodes and arrows
        for i, node in enumerate(nodes):
            self.play(Create(node), run_time=0.6)
            if i < len(nodes) - 1:
                arrow = Arrow(node.get_bottom(), nodes[i + 1].get_top(), buff=0.1, color=GRAY, stroke_width=2)
                arrows.add(arrow)
                self.play(Create(arrow), run_time=0.3)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Mind Map Scene - Central topic with radiating branches
 */
function generateMindMapScene(className, title, visualData, bullets, waitTime) {
    const centerTopic = escapeForPython(visualData.centerTopic || 'Main Topic', 25);
    const branches = visualData.branches || bullets.map((b, i) => ({
        label: typeof b === 'string' ? b : b.text || `Branch ${i + 1}`,
        subBranches: []
    }));

    let branchesCode = '';
    const colors = ['BLUE_C', 'GREEN_C', 'ORANGE', 'PURPLE', 'TEAL', 'RED_C'];

    branches.slice(0, 6).forEach((branch, i) => {
        const label = escapeForPython(typeof branch === 'string' ? branch : branch.label || `Branch ${i + 1}`, 25);
        const color = colors[i % colors.length];
        const angle = (i * 60 - 30) * Math.PI / 180;
        const x = Math.cos(angle) * 3.5;
        const y = Math.sin(angle) * 2.5;

        branchesCode += `
        # Branch ${i + 1}: ${label}
        branch${i} = VGroup(
            RoundedRectangle(height=0.7, width=2.5, corner_radius=0.2, color=${color}, fill_opacity=0.4),
            Text("${label}", font_size=16, color=${color})
        ).move_to([${x.toFixed(2)}, ${y.toFixed(2)}, 0])

        line${i} = CubicBezier(
            center.get_center(),
            center.get_center() + np.array([${(x * 0.3).toFixed(2)}, ${(y * 0.3).toFixed(2)}, 0]),
            branch${i}.get_center() + np.array([${(-x * 0.3).toFixed(2)}, ${(-y * 0.3).toFixed(2)}, 0]),
            branch${i}.get_center(),
            color=${color},
            stroke_width=3
        )

        branches.add(branch${i})
        lines.add(line${i})
        `;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Central topic
        center = VGroup(
            Circle(radius=1.2, color=GOLD, fill_opacity=0.5),
            Text("${centerTopic}", font_size=20, color=GOLD)
        )
        self.play(Create(center), run_time=1)

        branches = VGroup()
        lines = VGroup()

${branchesCode}

        # Animate branches radiating out
        for line, branch in zip(lines, branches):
            self.play(Create(line), run_time=0.4)
            self.play(FadeIn(branch, scale=0.8), run_time=0.4)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * Matrix Table Scene - Rows and columns with headers
 */
function generateMatrixTableScene(className, title, visualData, waitTime) {
    const headers = visualData.headers || ['Col 1', 'Col 2', 'Col 3'];
    const rows = visualData.rows || [
        ['A1', 'A2', 'A3'],
        ['B1', 'B2', 'B3'],
        ['C1', 'C2', 'C3']
    ];
    const showRowHeaders = visualData.rowHeaders || null;

    let tableCode = '';
    const cellWidth = 2.2;
    const cellHeight = 0.7;

    // Header row
    headers.slice(0, 5).forEach((header, i) => {
        const h = escapeForPython(header, 15);
        const xPos = (i - (headers.length - 1) / 2) * cellWidth;

        tableCode += `
        header${i} = VGroup(
            Rectangle(height=${cellHeight}, width=${cellWidth - 0.1}, color=BLUE_C, fill_opacity=0.4),
            Text("${h}", font_size=18, color=BLUE_C)
        ).move_to([${xPos.toFixed(2)}, 2, 0])
        headers.add(header${i})
        `;
    });

    // Data rows
    rows.slice(0, 5).forEach((row, rowIdx) => {
        row.slice(0, 5).forEach((cell, colIdx) => {
            const c = escapeForPython(cell, 15);
            const xPos = (colIdx - (headers.length - 1) / 2) * cellWidth;
            const yPos = 2 - (rowIdx + 1) * cellHeight - 0.2;

            tableCode += `
        cell${rowIdx}_${colIdx} = VGroup(
            Rectangle(height=${cellHeight}, width=${cellWidth - 0.1}, color=GRAY, fill_opacity=0.1, stroke_width=1),
            Text("${c}", font_size=16, color=WHITE)
        ).move_to([${xPos.toFixed(2)}, ${yPos.toFixed(2)}, 0])
        cells.add(cell${rowIdx}_${colIdx})
        `;
        });
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        headers = VGroup()
        cells = VGroup()

${tableCode}

        # Animate headers first
        self.play(LaggedStart(*[FadeIn(h, shift=DOWN * 0.2) for h in headers], lag_ratio=0.1), run_time=1)

        # Animate cells row by row
        self.play(LaggedStart(*[FadeIn(c, shift=DOWN * 0.1) for c in cells], lag_ratio=0.05), run_time=2)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * 3D Surface Scene - Rotating 3D surface plot
 */
function generate3DSurfaceScene(className, title, visualData, waitTime) {
    const func = visualData.function || 'np.sin(np.sqrt(x**2 + y**2))';
    const xRange = visualData.xRange || [-3, 3];
    const yRange = visualData.yRange || [-3, 3];
    const resolution = visualData.resolution || 20;
    const colorScheme = visualData.colorScheme || 'BLUE_GREEN';

    return `
class ${className}(ThreeDScene):
    def construct(self):
        # Set camera orientation for 3D view
        self.set_camera_orientation(phi=60 * DEGREES, theta=-45 * DEGREES)

        title = Text("${title}", font_size=40, color=BLUE_C)
        title.to_corner(UL)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1.5)

        # Create 3D axes
        axes = ThreeDAxes(
            x_range=[${xRange[0]}, ${xRange[1]}, 1],
            y_range=[${yRange[0]}, ${yRange[1]}, 1],
            z_range=[-2, 2, 0.5],
            x_length=6,
            y_length=6,
            z_length=4
        )

        # Create surface
        surface = Surface(
            lambda u, v: axes.c2p(u, v, ${func.replace(/x/g, 'u').replace(/y/g, 'v')}),
            u_range=[${xRange[0]}, ${xRange[1]}],
            v_range=[${yRange[0]}, ${yRange[1]}],
            resolution=(${resolution}, ${resolution}),
            fill_opacity=0.7
        )
        surface.set_fill_by_value(axes=axes, colorscale=[(BLUE, -1), (GREEN, 0), (YELLOW, 1)])

        self.play(Create(axes), run_time=1.5)
        self.play(Create(surface), run_time=2)

        # Rotate camera around the surface
        self.begin_ambient_camera_rotation(rate=0.3)
        self.wait(${Math.min(waitTime, 8)})
        self.stop_ambient_camera_rotation()

        self.wait(1)
        self.play(*[FadeOut(m) for m in self.mobjects if m != title], run_time=1)
`;
}

/**
 * Circuit Diagram Scene - Logic gates and connections
 */
function generateCircuitDiagramScene(className, title, visualData, waitTime) {
    const gates = visualData.gates || [
        { type: 'AND', inputs: ['A', 'B'], output: 'X' },
        { type: 'OR', inputs: ['X', 'C'], output: 'Y' }
    ];
    const showTruthTable = visualData.showTruthTable || false;

    let gatesCode = '';
    let xPos = -3;

    gates.slice(0, 4).forEach((gate, i) => {
        const type = gate.type || 'AND';
        const inputs = gate.inputs || ['A', 'B'];
        const output = escapeForPython(gate.output || 'Out', 10);
        const color = type === 'AND' ? 'BLUE_C' : type === 'OR' ? 'GREEN_C' : type === 'NOT' ? 'ORANGE' : 'PURPLE';

        gatesCode += `
        # Gate ${i + 1}: ${type}
        gate${i}_body = RoundedRectangle(height=1.5, width=2, corner_radius=0.2, color=${color}, fill_opacity=0.3)
        gate${i}_body.move_to([${xPos}, 0, 0])
        gate${i}_label = Text("${type}", font_size=20, color=${color})
        gate${i}_label.move_to(gate${i}_body)
        gate${i}_out = Text("${output}", font_size=14, color=WHITE)
        gate${i}_out.next_to(gate${i}_body, RIGHT, buff=0.5)

        gates.add(VGroup(gate${i}_body, gate${i}_label, gate${i}_out))

        # Input lines
        ${inputs.map((inp, j) => {
            const inputLabel = escapeForPython(inp, 5);
            const yOffset = (j - (inputs.length - 1) / 2) * 0.4;
            return `
        inp${i}_${j} = Line(LEFT * 1.5, ORIGIN, color=GRAY).next_to(gate${i}_body, LEFT, buff=0).shift(UP * ${yOffset})
        inp${i}_${j}_label = Text("${inputLabel}", font_size=12, color=GRAY).next_to(inp${i}_${j}, LEFT, buff=0.1)
        inputs.add(VGroup(inp${i}_${j}, inp${i}_${j}_label))
        `;
        }).join('')}

        # Output line
        out${i} = Line(ORIGIN, RIGHT * 1, color=${color}).next_to(gate${i}_body, RIGHT, buff=0)
        outputs.add(out${i})
        `;

        xPos += 4;
    });

    return `
class ${className}(Scene):
    def construct(self):
        title = Text("${title}", font_size=44, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        gates = VGroup()
        inputs = VGroup()
        outputs = VGroup()

${gatesCode}

        # Animate circuit building
        for i, gate in enumerate(gates):
            self.play(Create(gate), run_time=0.8)

        self.play(Create(inputs), run_time=1)
        self.play(Create(outputs), run_time=0.8)

        # Signal animation
        for _ in range(2):
            signal = Dot(color=YELLOW, radius=0.15)
            if len(inputs) > 0:
                signal.move_to(inputs[0].get_left())
                self.add(signal)
                self.play(signal.animate.move_to(outputs[-1].get_right() if len(outputs) > 0 else ORIGIN), run_time=1.5)
                self.play(FadeOut(signal), run_time=0.3)

        self.wait(${waitTime})
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)
`;
}

/**
 * DNA Helix Scene - Animated double helix structure
 */
function generateDNAHelixScene(className, title, visualData, waitTime) {
    const basePairs = visualData.basePairs || 10;
    const showLabels = visualData.showLabels !== false;
    const rotationSpeed = visualData.rotationSpeed || 0.5;

    return `
class ${className}(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=75 * DEGREES, theta=-45 * DEGREES)

        title = Text("${title}", font_size=40, color=BLUE_C)
        title.to_corner(UL)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1.5)

        # Create DNA helix structure
        helix1_points = []
        helix2_points = []
        base_pairs = VGroup()

        num_pairs = ${basePairs}
        for i in range(num_pairs * 10):
            t = i / 10
            angle = t * PI / 2

            # First strand
            x1 = np.cos(angle) * 1.5
            y1 = np.sin(angle) * 1.5
            z1 = t * 0.4 - 2

            # Second strand (180 degrees offset)
            x2 = np.cos(angle + PI) * 1.5
            y2 = np.sin(angle + PI) * 1.5
            z2 = t * 0.4 - 2

            helix1_points.append([x1, y1, z1])
            helix2_points.append([x2, y2, z2])

            # Add base pairs every 10 points
            if i % 10 == 0 and i > 0:
                base_pair = Line3D(
                    start=np.array([x1, y1, z1]),
                    end=np.array([x2, y2, z2]),
                    color=GOLD,
                    stroke_width=3
                )
                base_pairs.add(base_pair)

        # Create helix curves
        helix1 = VMobject(color=BLUE_C, stroke_width=4)
        helix1.set_points_smoothly([np.array(p) for p in helix1_points])

        helix2 = VMobject(color=GREEN_C, stroke_width=4)
        helix2.set_points_smoothly([np.array(p) for p in helix2_points])

        # Animate helix construction
        self.play(Create(helix1), Create(helix2), run_time=2)
        self.play(LaggedStart(*[Create(bp) for bp in base_pairs], lag_ratio=0.1), run_time=2)

        ${showLabels ? `
        # Add labels
        label1 = Text("Strand 1", font_size=16, color=BLUE_C)
        label2 = Text("Strand 2", font_size=16, color=GREEN_C)
        self.add_fixed_in_frame_mobjects(label1, label2)
        label1.to_edge(RIGHT).shift(UP)
        label2.to_edge(RIGHT).shift(DOWN)
        self.play(FadeIn(label1), FadeIn(label2), run_time=0.8)
        ` : ''}

        # Rotate camera around DNA
        self.begin_ambient_camera_rotation(rate=${rotationSpeed})
        self.wait(${Math.min(waitTime, 8)})
        self.stop_ambient_camera_rotation()

        self.wait(1)
        self.play(*[FadeOut(m) for m in self.mobjects if m != title], run_time=1)
`;
}

/**
 * Generate complete Manim Python file for all slides
 * Uses AI-generated code when available, falls back to templates
 * @param {Array} slides - Array of slide objects from video script
 * @param {string} jobId - Unique job identifier
 * @param {Object} options - Generation options
 * @param {boolean} options.useAI - Whether to use AI-generated code (default: true)
 * @param {string} options.theme - Visual theme for AI generation
 * @returns {Promise<string>} Path to generated Python file
 */
async function generateManimFile(slides, jobId, options = {}) {
    const { useAI = true, theme = 'general' } = options;
    const outputDir = path.join(TEMP_DIR, jobId);
    await fs.mkdir(outputDir, { recursive: true });

    const fileName = `video_${jobId}.py`;
    const filePath = path.join(outputDir, fileName);

    // Build complete Manim file with professional settings
    let manimCode = `
from manim import *
import numpy as np

# Auto-generated professional video scenes for job ${jobId}
# Generated at ${new Date().toISOString()}
# Mode: ${useAI ? 'AI-Enhanced' : 'Template-Based'}

# Professional video settings (3Blue1Brown style)
config.pixel_height = 720
config.pixel_width = 1280
config.frame_rate = 30
config.background_color = "${MANIM_COLORS.background}"

`;

    // Track AI vs template usage
    let aiGeneratedCount = 0;
    let templateCount = 0;

    // Add scene for each slide
    for (let index = 0; index < slides.length; index++) {
        const slide = slides[index];
        const duration = parseInt(slide.duration) || 40;
        let sceneCode = null;

        // Try AI-generated code if enabled
        if (useAI) {
            try {
                console.log(`  Generating AI code for slide ${index + 1}/${slides.length}...`);
                sceneCode = await generateManimCodeWithAI(slide, index, theme);
                if (sceneCode) {
                    aiGeneratedCount++;
                    console.log(`  ✓ AI code generated for slide ${index + 1}`);
                }
            } catch (error) {
                console.warn(`  ⚠ AI generation failed for slide ${index + 1}: ${error.message}`);
            }
        }

        // Fall back to template if AI failed or disabled
        if (!sceneCode) {
            sceneCode = generateManimSceneCode(slide, index, duration);
            templateCount++;
            if (useAI) {
                console.log(`  → Using template fallback for slide ${index + 1}`);
            }
        }

        manimCode += sceneCode;
        manimCode += '\n\n';
    }

    console.log(`✓ Code generation complete: ${aiGeneratedCount} AI-generated, ${templateCount} templates`);

    // Add main scene that plays all slides
    manimCode += `
class FullVideo(Scene):
    def construct(self):
        """Main scene that combines all slides"""
`;

    slides.forEach((slide, index) => {
        const duration = parseInt(slide.duration) || 40;
        const title = escapeForPython(slide.heading || slide.title || `Slide ${index + 1}`, 60);

        manimCode += `
        # Slide ${index + 1}: ${title}
        slide${index}_title = Text("${title}", font_size=40, color=BLUE_C).to_edge(UP, buff=0.5)
        self.play(Write(slide${index}_title), run_time=1.5)
        self.wait(${Math.max(1, duration - 3)})
        self.play(FadeOut(slide${index}_title), run_time=0.5)
`;
    });

    await fs.writeFile(filePath, manimCode);
    console.log(`✓ Generated Manim file: ${filePath}`);

    return filePath;
}

/**
 * Render Manim file to video
 * @param {string} manimFilePath - Path to Manim Python file
 * @param {string} sceneName - Name of scene to render
 * @param {string} outputDir - Directory for output video
 * @returns {Promise<string>} Path to rendered video file
 */
async function renderManimVideo(manimFilePath, sceneName, outputDir) {
    // Use python -m manim for cross-platform compatibility
    // -ql = low quality (720p30), -qm = medium (1080p30), -qh = high (1080p60)
    const command = `python -m manim render -ql "${manimFilePath}" ${sceneName}`;

    try {
        console.log(`Rendering Manim scene: ${sceneName}...`);
        console.log(`Command: ${command}`);

        const { stdout, stderr } = await execPromise(command, {
            timeout: 600000, // 10 minutes timeout for complex scenes
            cwd: path.dirname(manimFilePath)
        });

        console.log('Manim output:', stdout);
        if (stderr) console.log('Manim stderr:', stderr);

        // Manim creates output in: media/videos/{filename}/{quality}/{SceneName}.mp4
        const baseName = path.basename(manimFilePath, '.py');
        const cwd = path.dirname(manimFilePath);
        const mediaDir = path.join(cwd, 'media', 'videos', baseName);

        // Quality folders to check (Manim uses different ones based on settings)
        const qualities = ['720p30', '720p24', '720p15', '480p30', '480p15', '1080p30', '1080p60'];

        // Try to find the final rendered video
        for (const quality of qualities) {
            const qualityDir = path.join(mediaDir, quality);

            // Check for {SceneName}.mp4 directly in quality folder
            const directPath = path.join(qualityDir, `${sceneName}.mp4`);
            try {
                await fs.access(directPath);
                console.log(`✓ Video found at: ${directPath}`);
                return directPath;
            } catch {
                // Not found, continue
            }
        }

        // If not found directly, search recursively for any .mp4 file in media directory
        console.log('Searching for video files in media directory...');

        try {
            const findVideo = async (dir) => {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory() && entry.name !== 'partial_movie_files') {
                        const result = await findVideo(fullPath);
                        if (result) return result;
                    } else if (entry.isFile() && entry.name.endsWith('.mp4')) {
                        // Found a video file
                        console.log(`✓ Found video: ${fullPath}`);
                        return fullPath;
                    }
                }
                return null;
            };

            const foundVideo = await findVideo(mediaDir);
            if (foundVideo) {
                return foundVideo;
            }

            // Last resort: combine partial files if they exist
            for (const quality of qualities) {
                const partialsDir = path.join(mediaDir, quality, 'partial_movie_files', sceneName);
                try {
                    const partials = await fs.readdir(partialsDir);
                    const mp4Files = partials.filter(f => f.endsWith('.mp4')).sort();

                    if (mp4Files.length > 0) {
                        console.log(`Found ${mp4Files.length} partial files, combining...`);

                        // Create a concat file for FFmpeg
                        const concatFile = path.join(cwd, 'concat_list.txt');
                        const concatContent = mp4Files.map(f => `file '${path.join(partialsDir, f)}'`).join('\n');
                        await fs.writeFile(concatFile, concatContent);

                        // Combine with FFmpeg
                        const outputPath = path.join(mediaDir, quality, `${sceneName}.mp4`);
                        const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}" -y`;

                        await execPromise(ffmpegCmd);
                        await fs.unlink(concatFile);

                        console.log(`✓ Combined partials into: ${outputPath}`);
                        return outputPath;
                    }
                } catch {
                    // No partials in this quality folder
                }
            }

        } catch (e) {
            console.log('Error searching media directory:', e.message);
        }

        throw new Error(`Video file not found after rendering in ${mediaDir}`);
    } catch (error) {
        console.error('Manim rendering error:', error);
        throw new Error(`Failed to render video: ${error.message}`);
    }
}

/**
 * Generate narration audio for video using Edge TTS
 * @param {Array} slides - Array of slide objects with narration
 * @param {string} jobId - Unique job identifier
 * @returns {Promise<string>} Path to combined audio file
 */
async function generateVideoNarration(slides, jobId) {
    const outputDir = path.join(TEMP_DIR, jobId);
    await fs.mkdir(outputDir, { recursive: true });

    const audioFiles = [];

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const audioPath = path.join(outputDir, `narration_${i}.mp3`);
        const text = slide.narration || slide.title || `Section ${i + 1}`;

        // Clean text for TTS - remove problematic characters, don't escape
        const cleanedText = text
            .replace(/"/g, "'")           // Replace double quotes with single
            .replace(/`/g, "'")           // Replace backticks with single quotes
            .replace(/\\/g, '')           // Remove backslashes
            .replace(/[\r\n]+/g, ' ')     // Replace newlines with spaces
            .replace(/\s+/g, ' ')         // Normalize whitespace
            .trim();

        // Use file-based input for Edge TTS to avoid shell escaping issues
        const textFilePath = path.join(outputDir, `text_${i}.txt`);
        await fs.writeFile(textFilePath, cleanedText, 'utf8');

        const command = `python -m edge_tts --voice "en-US-JennyNeural" --file "${textFilePath}" --write-media "${audioPath}"`;

        try {
            await execPromise(command, { timeout: 60000 });
            audioFiles.push(audioPath);
        } catch (error) {
            console.error(`TTS error for slide ${i}:`, error.message);
            throw new Error(`Failed to generate narration: ${error.message}`);
        }
    }

    // Combine all audio files
    const combinedAudioPath = path.join(outputDir, 'full_narration.mp3');
    const listPath = path.join(outputDir, 'audio_list.txt');

    let listContent = '';
    for (const audioFile of audioFiles) {
        listContent += `file '${audioFile.replace(/\\/g, '/')}'\n`;
    }
    await fs.writeFile(listPath, listContent);

    await execPromise(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:a libmp3lame -q:a 2 "${combinedAudioPath}"`);

    return combinedAudioPath;
}

/**
 * Combine video and audio into final output
 * @param {string} videoPath - Path to video file
 * @param {string} audioPath - Path to audio file
 * @param {string} outputPath - Path for final output
 * @returns {Promise<string>} Path to final video
 */
async function combineVideoAudio(videoPath, audioPath, outputPath) {
    const command = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`;

    try {
        await execPromise(command, { timeout: 120000 });
        return outputPath;
    } catch (error) {
        console.error('Video/audio combine error:', error);
        throw new Error(`Failed to combine video and audio: ${error.message}`);
    }
}

/**
 * Get video duration using ffprobe
 * @param {string} videoPath - Path to video file
 * @returns {Promise<number>} Duration in seconds
 */
async function getVideoDuration(videoPath) {
    try {
        const { stdout } = await execPromise(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
        );
        return parseFloat(stdout.trim());
    } catch {
        return 0;
    }
}

/**
 * Generate thumbnail from video
 * @param {string} videoPath - Path to video file
 * @param {string} outputPath - Path for thumbnail
 * @returns {Promise<string>} Path to thumbnail
 */
async function generateThumbnail(videoPath, outputPath) {
    const command = `ffmpeg -y -i "${videoPath}" -ss 00:00:02 -vframes 1 -vf "scale=640:360" "${outputPath}"`;

    try {
        await execPromise(command, { timeout: 30000 });
        return outputPath;
    } catch {
        console.warn('Failed to generate thumbnail');
        return null;
    }
}

/**
 * Clean up temporary files
 * @param {string} jobId - Job ID for temp directory
 */
async function cleanupVideoTemp(jobId) {
    const tempDir = path.join(TEMP_DIR, jobId);
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temp directory for job ${jobId}`);
    } catch (error) {
        console.error('Cleanup error:', error.message);
    }
}

/**
 * Sync a single slide video with its audio narration
 * Trims or extends video to match audio duration
 * @param {string} videoPath - Path to slide video
 * @param {string} audioPath - Path to slide audio
 * @param {string} outputPath - Path for synced output
 * @returns {Promise<string>} Path to synced video
 */
async function syncSlideWithAudio(videoPath, audioPath, outputPath) {
    const videoDur = await getVideoDuration(videoPath);
    const audioDur = await getVideoDuration(audioPath);

    console.log(`  Syncing: Video ${videoDur.toFixed(1)}s with Audio ${audioDur.toFixed(1)}s`);

    let command;
    if (videoDur < audioDur) {
        // Video is shorter - extend it by freezing last frame
        command = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=${audioDur - videoDur}[v]" -map "[v]" -map "1:a" -c:v libx264 -preset fast -c:a aac -shortest "${outputPath}"`;
    } else {
        // Video is longer or equal - trim to audio duration
        command = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -t ${audioDur} "${outputPath}"`;
    }

    try {
        await execPromise(command, { timeout: 120000 });
        return outputPath;
    } catch (error) {
        console.error('Sync error:', error.message);
        throw new Error(`Failed to sync slide: ${error.message}`);
    }
}

/**
 * Generate properly synchronized video from slides
 * Each slide's animation matches its narration duration
 * @param {Array} slides - Array of slide objects
 * @param {string} jobId - Unique job identifier
 * @param {Array} slideVideos - Array of rendered slide video paths
 * @param {Array} slideAudios - Array of slide audio paths
 * @param {string} outputPath - Final output path
 * @returns {Promise<string>} Path to final synced video
 */
async function generateSyncedVideo(slides, jobId, slideVideos, slideAudios, outputPath) {
    const tempDir = path.join(TEMP_DIR, jobId, 'synced');
    await fs.mkdir(tempDir, { recursive: true });

    console.log('Synchronizing slides with audio...');
    const syncedSlides = [];

    for (let i = 0; i < slides.length; i++) {
        const syncedPath = path.join(tempDir, `slide_${i}_synced.mp4`);
        console.log(`Syncing slide ${i + 1}/${slides.length}...`);

        await syncSlideWithAudio(slideVideos[i], slideAudios[i], syncedPath);
        syncedSlides.push(syncedPath);
    }

    // Create concat list
    const listPath = path.join(tempDir, 'concat_list.txt');
    let listContent = '';
    for (const syncedSlide of syncedSlides) {
        listContent += `file '${syncedSlide.replace(/\\/g, '/')}'\n`;
    }
    await fs.writeFile(listPath, listContent);

    // Concatenate all synced slides
    console.log('Concatenating synced slides...');
    const concatCommand = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;

    try {
        await execPromise(concatCommand, { timeout: 180000 });
        console.log(`✓ Synced video created: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Concat error:', error.message);
        throw new Error(`Failed to concatenate slides: ${error.message}`);
    }
}

/**
 * Render individual slide scenes from Manim file
 * @param {string} manimFilePath - Path to Manim Python file
 * @param {Array} sceneNames - Array of scene class names to render
 * @param {string} outputDir - Directory for output videos
 * @returns {Promise<Array>} Array of paths to rendered videos
 */
async function renderIndividualSlides(manimFilePath, sceneNames, outputDir) {
    const videoPaths = [];
    const baseName = path.basename(manimFilePath, '.py');
    const mediaDir = path.join(path.dirname(manimFilePath), 'media', 'videos', baseName);

    for (let i = 0; i < sceneNames.length; i++) {
        const sceneName = sceneNames[i];
        console.log(`Rendering scene ${i + 1}/${sceneNames.length}: ${sceneName}...`);

        // Use python -m manim for cross-platform compatibility
        const command = `python -m manim render -ql "${manimFilePath}" ${sceneName}`;

        try {
            await execPromise(command, {
                timeout: 180000, // 3 minutes per slide
                cwd: path.dirname(manimFilePath)
            });

            // Manim -ql outputs to 720p30 folder
            const qualities = ['720p30', '720p24', '480p15'];
            let foundPath = null;

            for (const quality of qualities) {
                const videoPath = path.join(mediaDir, quality, `${sceneName}.mp4`);
                try {
                    await fs.access(videoPath);
                    foundPath = videoPath;
                    break;
                } catch {
                    // Try next quality
                }
            }

            if (foundPath) {
                videoPaths.push(foundPath);
                console.log(`  ✓ Rendered: ${sceneName}.mp4`);
            } else {
                console.warn(`  ⚠ Could not find rendered video for ${sceneName}`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to render ${sceneName}:`, error.message);
        }
    }

    return videoPaths;
}

/**
 * Generate narration audio for each slide individually
 * Returns array of individual audio file paths
 * @param {Array} slides - Array of slide objects with narration
 * @param {string} jobId - Unique job identifier
 * @returns {Promise<Array>} Array of audio file paths
 */
async function generateSlideNarrations(slides, jobId) {
    const outputDir = path.join(TEMP_DIR, jobId, 'audio');
    await fs.mkdir(outputDir, { recursive: true });

    const audioFiles = [];

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const audioPath = path.join(outputDir, `narration_${i.toString().padStart(2, '0')}.mp3`);
        const text = slide.narration || slide.title || `Section ${i + 1}`;

        // Clean text for TTS - remove problematic characters, don't escape
        const cleanedText = text
            .replace(/"/g, "'")           // Replace double quotes with single
            .replace(/`/g, "'")           // Replace backticks with single quotes
            .replace(/\\/g, '')           // Remove backslashes
            .replace(/[\r\n]+/g, ' ')     // Replace newlines with spaces
            .replace(/\s+/g, ' ')         // Normalize whitespace
            .trim();

        // Use file-based input for Edge TTS to avoid shell escaping issues
        const textFilePath = path.join(outputDir, `text_${i}.txt`);
        await fs.writeFile(textFilePath, cleanedText, 'utf8');

        const command = `python -m edge_tts --voice "en-US-GuyNeural" --file "${textFilePath}" --write-media "${audioPath}"`;

        try {
            console.log(`Generating narration ${i + 1}/${slides.length}...`);
            await execPromise(command, { timeout: 60000 });
            audioFiles.push(audioPath);
        } catch (error) {
            console.error(`TTS error for slide ${i}:`, error.message);
            throw new Error(`Failed to generate narration: ${error.message}`);
        }
    }

    return audioFiles;
}

module.exports = {
    generateManimSceneCode,
    generateManimFile,
    renderManimVideo,
    renderIndividualSlides,
    generateVideoNarration,
    generateSlideNarrations,
    syncSlideWithAudio,
    generateSyncedVideo,
    combineVideoAudio,
    getVideoDuration,
    generateThumbnail,
    cleanupVideoTemp,
    VIDEO_OUTPUT_DIR,
    TEMP_DIR
};
