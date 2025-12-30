import { cn } from '@/lib/utils'
import { NodeViewWrapper } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'

export function ResizableImage({ node, updateAttributes, selected }: any) {
  const [width, setWidth] = useState(node.attrs.width)
  const [resizing, setResizing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setWidth(node.attrs.width)
  }, [node.attrs.width])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(true)

      const startX = e.clientX
      const startWidth = imgRef.current?.offsetWidth || 0

      const onMouseMove = (e: MouseEvent) => {
        const currentX = e.clientX
        const diffX = currentX - startX
        const newWidth = Math.max(100, startWidth + diffX) // Min width 100px
        setWidth(newWidth)
      }

      const onMouseUp = (e: MouseEvent) => {
        const currentX = e.clientX
        const diffX = currentX - startX
        const newWidth = Math.max(100, startWidth + diffX)

        updateAttributes({ width: newWidth })
        setResizing(false)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [updateAttributes],
  )

  return (
    <NodeViewWrapper className="relative inline-block leading-none my-4">
      <div className="relative inline-block group">
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          className={cn(
            'rounded-lg max-w-full h-auto transition-shadow',
            selected || resizing ? 'ring-2 ring-primary' : '',
          )}
          style={{ width: width ? `${width}px` : 'auto' }}
        />
        <button
          type="button"
          className={cn(
            'absolute right-2 bottom-2 w-3 h-3 bg-primary rounded-full cursor-ew-resize shadow-md border border-white z-10 opacity-0 group-hover:opacity-100 transition-opacity',
            (selected || resizing) && 'opacity-100',
          )}
          onMouseDown={handleMouseDown}
        />
      </div>
    </NodeViewWrapper>
  )
}
