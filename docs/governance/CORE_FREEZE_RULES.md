# Facttic Core Schema v1.0 — Freeze Rules

This document establishes the immutability of the Core Schema layer for version 1.0. Adherence to these rules is mandatory for all architectural and developmental activities.

## Immutable Core Rules

1. **No Schema Alterations**: Direct mutation of the core database schema is strictly prohibited under version 1.0.
2. **No New Core-Level Modifications**: No new tables, columns, or types may be added to the core namespace.
3. **No Foreign Key Changes**: Existing relationships and constraints are locked.
4. **No Inline Schema Mutation**: Schema changes via migrations or direct SQL for core tables are disallowed.
5. **Above-Core Expansion Only**: All functional expansions or new features must be implemented in layers above the core (e.g., application logic, derived views, or specialized schemas).
6. **Structural Versioning**: Any structural change to the core requires a formal version bump (e.g., v1.1 or v2.0) and architectural review.

## Verification Requirements

All deployments must pass a zero-drift check against the hash of the v1.0 core schema definition.
