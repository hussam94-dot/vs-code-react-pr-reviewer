import React, { useState } from 'react';

// ❌ Bad: Component defined inside another component file but not exported properly
const Child = (props: any) => {
    // ❌ Bad: Props mutation
    props.name = "Mutated Name";
    return <div>{props.name}</div>
}

export const BadComponent = () => {
    const [items, setItems] = useState(['A', 'B', 'C']);
    const [count, setCount] = useState(0);

    // ❌ Bad: console.log left in production code
    console.log("Rendering...");

    const handleClick = () => {
        // ❌ Bad: Direct state mutation
        items.push('D');
        // ❌ Bad: Force update via state for mutated object
        setItems(items);
    };

    return (
        <div>
            <h1>Test Component</h1>
            {/* ❌ Bad: Inline function in render */}
            <button onClick={() => setCount(count + 1)}>Increment</button>

            <ul>
                {items.map((item, index) => (
                    // ❌ Bad: Index as key
                    <li key={index}>
                        {item}
                        <Child name={item} />
                    </li>
                ))}
            </ul>
        </div>
    );
};
