import { createTw } from 'react-pdf-tailwind';

export const tw = createTw({
    theme: {
        extend: {
            colors: {
                primary: '#000000',
            },
        },
    },
});
