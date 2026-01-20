"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = exports.Header = void 0;
const react_1 = require("react");
// Issue: No props validation, no TypeScript interface
const Header = (props) => {
    // Issue: Direct mutation attempt
    props.title = props.title.toUpperCase();
    return (<header style={{ padding: '20px', backgroundColor: '#333', color: 'white' }}>
            <h1>{props.title}</h1>
            {props.showSubtitle && <h2>{props.subtitle}</h2>}
        </header>);
};
exports.Header = Header;
// Issue: Component too simple, could be replaced with a functional approach
class Footer extends react_1.default.Component {
    render() {
        return (<footer style={{ padding: '10px', textAlign: 'center', marginTop: '50px' }}>
                <p>&copy; 2024 My App. All rights reserved.</p>
            </footer>);
    }
}
exports.Footer = Footer;
//# sourceMappingURL=Components.js.map