'use client';

interface ButtonProps {
    title: String;
}

export default function Button({title}: ButtonProps) {

    return (
        <div>
            {title}
        </div>
    );
}