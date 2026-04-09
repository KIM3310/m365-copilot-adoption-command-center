from setuptools import find_packages, setup


setup(
    name="m365-copilot-adoption-command-center",
    version="0.1.0",
    description="Interview-ready Microsoft 365 Copilot adoption project with React, FastAPI, readiness planning, and value realization artifacts.",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.111,<1.0",
        "uvicorn>=0.30,<1.0",
    ],
    extras_require={
        "dev": [
            "httpx>=0.27,<1.0",
            "pytest>=8.0,<9.0",
        ]
    },
)
