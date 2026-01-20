import React from 'react';

// Issue: No props validation, no TypeScript interface
export const Header = (props: any) => {
    // Issue: Direct mutation attempt
    props.title = props.title.toUpperCase();

    return (
        <header style={{ padding: '20px', backgroundColor: '#333', color: 'white' }}>
            <h1>{props.title}</h1>
            {props.showSubtitle && <h2>{props.subtitle}</h2>}
        </header>
    );
};

// Issue: Component too simple, could be replaced with a functional approach
export class Footer extends React.Component {
    render() {
        return (
            <footer style={{ padding: '10px', textAlign: 'center', marginTop: '50px' }}>
                <p>&copy; 2024 My App. All rights reserved.</p>
            </footer>
        );
    }
}
